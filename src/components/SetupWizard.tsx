"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CheckCircle2, Circle, ExternalLink, AlertCircle, PartyPopper, Save, Eye, EyeOff, Copy, Check, Loader2, Lock } from "lucide-react"

interface Status {
    configured: boolean
    oura: { configured: boolean; authorized: boolean; client_id: boolean; client_secret: boolean }
    telegram: { configured: boolean; bot_token: boolean; chat_id: boolean }
    ai: { configured: boolean; model: string; api_key: boolean }
    base_url: string
}

interface ConfigValues {
    [key: string]: { set: boolean; masked: string }
}

interface SetupWizardProps {
    status: Status | null
    onComplete: () => void
    success: string | null
    error: string | null
}

const AI_MODELS = [
    {
        provider: "OpenAI", models: [
            { value: "gpt-4o", label: "GPT-4o" },
            { value: "o1", label: "o1" },
            { value: "o3-mini", label: "o3-mini" },
            { value: "gpt-5.2", label: "GPT-5.2" },
        ]
    },
    {
        provider: "Google Gemini", models: [
            { value: "gemini-3.1-pro", label: "Gemini 3.1 Pro" },
            { value: "gemini-3.1-flash", label: "Gemini 3.1 Flash" },
            { value: "gemini-3.0-pro", label: "Gemini 3.0 Pro" },
            { value: "gemini-2.5-pro", label: "Gemini 2.5 Pro" },
        ]
    },
    {
        provider: "Anthropic", models: [
            { value: "claude-4-6-sonnet-20260217", label: "Claude 4.6 Sonnet" },
            { value: "claude-4-6-opus-20260205", label: "Claude 4.6 Opus" },
            { value: "claude-3-5-sonnet-20241022", label: "Claude 3.5 Sonnet" },
        ]
    },
]

export function SetupWizard({ status, onComplete, success, error }: SetupWizardProps) {
    const [authStatus, setAuthStatus] = useState<"checking" | "unauthorized" | "needs_setup" | "authorized">("checking")
    const [password, setPassword] = useState("")
    const [unlockPwd, setUnlockPwd] = useState("")
    const [unlockError, setUnlockError] = useState(false)

    const [config, setConfig] = useState<ConfigValues>({})
    const [form, setForm] = useState({
        password: "", // used for initial setup
        TELEGRAM_BOT_TOKEN: "",
        TELEGRAM_CHAT_ID: "",
        AI_API_KEY: "",
        AI_MODEL: "gpt-4o",
        OURA_CLIENT_ID: "",
        OURA_CLIENT_SECRET: "",
    })

    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)
    const [connectingOura, setConnectingOura] = useState(false)
    const [settingUpWebhook, setSettingUpWebhook] = useState(false)
    const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({})
    const [copied, setCopied] = useState("")

    const fetchConfig = useCallback(async (pwd?: string) => {
        try {
            const headers: Record<string, string> = {}
            if (pwd) headers.Authorization = `Bearer ${pwd}`

            const res = await fetch("/api/config", { headers })
            const data = await res.json()

            if (data.needsPassword) {
                setAuthStatus("needs_setup")
                return
            }

            if (res.status === 401) {
                setAuthStatus("unauthorized")
                if (pwd) setUnlockError(true)
                return
            }

            setAuthStatus("authorized")
            if (pwd) setPassword(pwd)
            setConfig(data)

            if (data.AI_MODEL?.set && data.AI_MODEL.masked) {
                setForm(f => ({ ...f, AI_MODEL: data.AI_MODEL.masked }))
            }
        } catch { }
    }, [])

    useEffect(() => {
        fetchConfig()
    }, [fetchConfig])

    const handleSavePassword = async () => {
        setSaving(true)
        try {
            const res = await fetch("/api/config", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password: form.password }),
            })

            if (!res.ok) throw new Error("Failed to save password")

            // Re-fetch config with the newly created password to sync state
            await fetchConfig(form.password)
        } catch {
            // ignore
        } finally {
            setSaving(false)
        }
    }

    const handleSave = async () => {
        setSaving(true)
        setSaved(false)
        try {
            const payload: Record<string, string> = {}
            for (const [key, val] of Object.entries(form)) {
                if (val) payload[key] = val
            }

            const headers: Record<string, string> = { "Content-Type": "application/json" }
            if (password) headers.Authorization = `Bearer ${password}`

            const res = await fetch("/api/config", {
                method: "POST",
                headers,
                body: JSON.stringify(payload),
            })

            if (!res.ok) throw new Error("Failed to save")

            setSaved(true)

            const effectivePwd = authStatus === "needs_setup" ? form.password : password
            if (authStatus === "needs_setup") {
                setPassword(form.password)
                setAuthStatus("authorized")
            }

            const [newConfig] = await Promise.all([
                fetch("/api/config", { headers: { Authorization: `Bearer ${effectivePwd}` } }).then(r => r.json()),
                onComplete(),
            ])
            setConfig(newConfig)
            setForm(f => ({
                password: "",
                TELEGRAM_BOT_TOKEN: "",
                TELEGRAM_CHAT_ID: "",
                AI_API_KEY: "",
                AI_MODEL: f.AI_MODEL,
                OURA_CLIENT_ID: "",
                OURA_CLIENT_SECRET: "",
            }))
            setTimeout(() => setSaved(false), 3000)
        } catch {
            // ignore
        } finally {
            setSaving(false)
        }
    }

    const handleConnectOura = async () => {
        setConnectingOura(true)
        try {
            const headers: Record<string, string> = {}
            if (password) headers.Authorization = `Bearer ${password}`

            const res = await fetch("/api/oura/auth", { headers })
            const data = await res.json()
            window.location.href = data.auth_url
        } catch {
            setConnectingOura(false)
        }
    }

    const handleSetupWebhook = async () => {
        setSettingUpWebhook(true)
        try {
            const headers: Record<string, string> = { "Content-Type": "application/json" }
            if (password) headers.Authorization = `Bearer ${password}`

            await fetch("/api/telegram/setup", {
                method: "POST",
                headers,
                body: JSON.stringify({ action: "setup" }),
            })
            onComplete()
        } finally {
            setSettingUpWebhook(false)
        }
    }

    const copyText = (text: string, id: string) => {
        navigator.clipboard.writeText(text)
        setCopied(id)
        setTimeout(() => setCopied(""), 2000)
    }

    const toggleSecret = (key: string) => setShowSecrets(s => ({ ...s, [key]: !s[key] }))

    const steps = [
        { id: "config", title: "Configure", completed: status?.telegram?.configured && status?.ai?.configured, icon: "⚙️" },
        { id: "oura", title: "Oura Ring", completed: status?.oura?.authorized ?? false, icon: "💍" },
        { id: "webhook", title: "Activate", completed: false, icon: "🚀" },
    ]
    const completedCount = steps.filter(s => s.completed).length

    const renderField = (key: string, label: string, placeholder: string, helpLink?: { text: string; url: string }) => {
        const isSecret = key !== "TELEGRAM_CHAT_ID"
        const isSet = config[key]?.set
        const masked = config[key]?.masked || ""

        return (
            <div className="space-y-2" key={key}>
                <div className="flex items-center gap-2">
                    <Label htmlFor={key} className="text-sm font-medium">{label}</Label>
                    {isSet && <Badge variant="secondary" className="bg-green-500/10 text-green-500 text-[10px] h-5">Set</Badge>}
                    {helpLink && (
                        <a href={helpLink.url} target="_blank" className="ml-auto text-xs text-muted-foreground hover:text-primary flex items-center gap-1">
                            {helpLink.text} <ExternalLink className="h-3 w-3" />
                        </a>
                    )}
                </div>
                <div className="relative">
                    <Input
                        id={key}
                        type={(isSecret && !showSecrets[key]) ? "password" : "text"}
                        placeholder={isSet ? masked : placeholder}
                        value={form[key as keyof typeof form] || ""}
                        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                        className="pr-10 font-mono text-xs"
                    />
                    {isSecret && (
                        <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => toggleSecret(key)}>
                            {showSecrets[key] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                        </Button>
                    )}
                </div>
            </div>
        )
    }

    if (authStatus === "checking") {
        return <div className="py-12 text-center text-muted-foreground animate-pulse">Checking security...</div>
    }

    if (authStatus === "needs_setup") {
        return (
            <Card className="max-w-md mx-auto mt-8 border-primary/20 bg-primary/5">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Lock className="h-5 w-5 text-primary" />
                        Admin Password Setup
                    </CardTitle>
                    <CardDescription>
                        Create an Admin Password for this instance. You must set this first to secure your instance before configuring any API keys.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Input
                            type="password"
                            placeholder="Enter a strong password"
                            value={form.password}
                            onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                            onKeyDown={e => e.key === "Enter" && form.password && handleSavePassword()}
                            autoFocus
                        />
                    </div>
                    <Button
                        className="w-full"
                        onClick={async () => handleSavePassword()}
                        disabled={!form.password || saving}
                    >
                        {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : "Save Admin Password"}
                    </Button>
                </CardContent>
            </Card>
        )
    }

    if (authStatus === "unauthorized") {
        return (
            <Card className="max-w-md mx-auto mt-8 border-primary/20 bg-primary/5">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Lock className="h-5 w-5 text-primary" />
                        Configuration Locked
                    </CardTitle>
                    <CardDescription>Enter your Admin Password to view and change configurations.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Input
                            type="password"
                            placeholder="Admin Password"
                            value={unlockPwd}
                            onChange={e => { setUnlockPwd(e.target.value); setUnlockError(false) }}
                            onKeyDown={e => e.key === "Enter" && fetchConfig(unlockPwd)}
                            autoFocus
                        />
                        {unlockError && <p className="text-xs text-destructive">Incorrect password</p>}
                    </div>
                    <Button className="w-full" onClick={() => fetchConfig(unlockPwd)} disabled={!unlockPwd}>Unlock</Button>

                    <div className="pt-4 mt-2 border-t border-border/50 text-center space-y-2">
                        <p className="text-xs text-muted-foreground">Not the owner of this instance?</p>
                        <Button variant="outline" size="sm" className="w-full text-xs" asChild>
                            <a href="https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fxirry-xyz%2Foura-mate&project-name=oura-mate&repository-name=oura-mate&demo-title=Oura%20Mate%20%E2%80%94%20AI%20Health%20Analyzer&demo-url=https%3A%2F%2Foura-mate.xirry.xyz&envDescription=Please%20click%20Storage%20-%3E%20Upstash%20Redis%20in%20your%20Vercel%20dashboard%20to%20auto-fill%20these%20tokens.">
                                Deploy Your Own Oura Mate
                            </a>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-6">
            {/* Success/Error alerts */}
            {success === "oura_connected" && (
                <Alert className="border-green-500/50 bg-green-500/10">
                    <PartyPopper className="h-4 w-4 text-green-500" />
                    <AlertDescription className="text-green-500">Oura Ring connected successfully! 🎉</AlertDescription>
                </Alert>
            )}
            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                        {error === "oauth_denied" ? "OAuth authorization was denied."
                            : error === "token_exchange_failed" ? "Failed to exchange token. Please try again."
                                : error === "invalid_state" ? "Security check failed. Please try connecting again."
                                    : `Error: ${error}`}
                    </AlertDescription>
                </Alert>
            )}

            {/* Progress */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Setup Progress</CardTitle>
                    <CardDescription>{completedCount}/3 steps completed</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-2">
                        {steps.map((step) => (
                            <div key={step.id} className="flex-1 space-y-1">
                                <div className={`h-2 rounded-full transition-colors ${step.completed ? "bg-green-500" : "bg-muted"}`} />
                                <p className="text-[10px] text-muted-foreground text-center">{step.icon} {step.title}</p>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {saved && (
                <Alert className="border-green-500/50 bg-green-500/10">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <AlertDescription className="text-green-500">Configuration saved! ✓</AlertDescription>
                </Alert>
            )}

            {/* Step 1: All Config */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className="text-2xl">⚙️</span>
                            <div>
                                <CardTitle className="text-base flex items-center gap-2">
                                    Step 1: Configuration
                                    {steps[0].completed && <Badge variant="secondary" className="bg-green-500/10 text-green-500 text-xs">Done</Badge>}
                                </CardTitle>
                                <CardDescription className="mt-1">Enter your API keys below</CardDescription>
                            </div>
                        </div>
                        {steps[0].completed ? <CheckCircle2 className="h-5 w-5 text-green-500" /> : <Circle className="h-5 w-5 text-muted-foreground" />}
                    </div>
                </CardHeader>
                <CardContent className="pt-0 space-y-6">
                    <Separator />

                    {/* Telegram */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-semibold flex items-center gap-2">🤖 Telegram Bot</h4>
                        {renderField("TELEGRAM_BOT_TOKEN", "Bot Token", "123456:ABC-DEF...", { text: "@BotFather", url: "https://t.me/BotFather" })}
                        {renderField("TELEGRAM_CHAT_ID", "Chat ID", "123456789", { text: "@userinfobot", url: "https://t.me/userinfobot" })}
                    </div>

                    <Separator />

                    {/* AI */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-semibold flex items-center gap-2">🧠 AI Provider</h4>

                        <div className="space-y-2">
                            <Label htmlFor="AI_MODEL" className="text-sm font-medium">Model</Label>
                            <Select value={form.AI_MODEL} onValueChange={v => setForm(f => ({ ...f, AI_MODEL: v }))}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select a model" />
                                </SelectTrigger>
                                <SelectContent>
                                    {AI_MODELS.map(group => (
                                        <div key={group.provider}>
                                            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">{group.provider}</div>
                                            {group.models.map(m => (
                                                <SelectItem key={m.value} value={m.value}>
                                                    <span className="flex items-center gap-2">
                                                        <span>{m.label}</span>
                                                        <span className="text-[10px] text-muted-foreground font-mono">{m.value}</span>
                                                    </span>
                                                </SelectItem>
                                            ))}
                                        </div>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {renderField("AI_API_KEY", "API Key", form.AI_MODEL.startsWith("gemini") ? "AIzaSy..." : form.AI_MODEL.startsWith("claude") ? "sk-ant-..." : "sk-...", {
                            text: "Get key",
                            url: form.AI_MODEL.startsWith("gemini")
                                ? "https://aistudio.google.com"
                                : form.AI_MODEL.startsWith("claude")
                                    ? "https://console.anthropic.com"
                                    : "https://platform.openai.com"
                        })}
                    </div>

                    <Separator />

                    {/* Oura */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-semibold flex items-center gap-2">💍 Oura Ring</h4>
                        <p className="text-xs text-muted-foreground">
                            Create an app at <a href="https://developer.ouraring.com/applications" target="_blank" className="text-primary underline">Oura Developer Portal</a>, set Redirect URI to:
                        </p>
                        <div className="flex items-center gap-2">
                            <code className="bg-muted px-2 py-1 rounded text-xs break-all flex-1">{status?.base_url}/api/oura/callback</code>
                            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => copyText(`${status?.base_url}/api/oura/callback`, "redirect")}>
                                {copied === "redirect" ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                            </Button>
                        </div>
                        {renderField("OURA_CLIENT_ID", "Client ID", "XXXXX...")}
                        {renderField("OURA_CLIENT_SECRET", "Client Secret", "XXXXX...")}
                    </div>

                    <Separator />

                    {/* Save button */}
                    <Button
                        onClick={handleSave}
                        disabled={saving}
                        className="w-full"
                    >
                        {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : <><Save className="mr-2 h-4 w-4" /> Save Configuration</>}
                    </Button>
                </CardContent>
            </Card>

            {/* Step 2: Connect Oura */}
            <Card className={steps[1].completed ? "border-green-500/30" : ""}>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className="text-2xl">💍</span>
                            <div>
                                <CardTitle className="text-base flex items-center gap-2">
                                    Step 2: Connect Oura Ring
                                    {steps[1].completed && <Badge variant="secondary" className="bg-green-500/10 text-green-500 text-xs">Done</Badge>}
                                </CardTitle>
                                <CardDescription className="mt-1">Authorize access to your health data</CardDescription>
                            </div>
                        </div>
                        {steps[1].completed ? <CheckCircle2 className="h-5 w-5 text-green-500" /> : <Circle className="h-5 w-5 text-muted-foreground" />}
                    </div>
                </CardHeader>
                <CardContent className="pt-0">
                    <Separator className="mb-4" />
                    {status?.oura?.configured ? (
                        <Button onClick={handleConnectOura} disabled={connectingOura} className="w-full">
                            {connectingOura ? "Redirecting..." : "🔗 Connect Oura Ring"}
                        </Button>
                    ) : (
                        <p className="text-sm text-muted-foreground text-center py-2">Save your Oura Client ID/Secret in Step 1 first</p>
                    )}
                </CardContent>
            </Card>

            {/* Step 3: Activate */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className="text-2xl">🚀</span>
                            <div>
                                <CardTitle className="text-base">Step 3: Activate Bot</CardTitle>
                                <CardDescription className="mt-1">Register Telegram webhook</CardDescription>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="pt-0">
                    <Separator className="mb-4" />
                    <Button
                        onClick={handleSetupWebhook}
                        disabled={settingUpWebhook || !status?.telegram?.configured}
                        className="w-full"
                    >
                        {settingUpWebhook ? "Setting up..." : "⚡ Activate Telegram Bot"}
                    </Button>
                </CardContent>
            </Card>

            {/* All done */}
            {completedCount >= 2 && (
                <Card className="border-green-500/30 bg-green-500/5">
                    <CardContent className="pt-6 text-center">
                        <p className="text-2xl mb-2">🎉</p>
                        <p className="font-semibold">All set!</p>
                        <p className="text-sm text-muted-foreground mt-1">
                            Send <code className="bg-muted px-1.5 py-0.5 rounded text-xs">/today</code> in Telegram.
                        </p>
                        <Button className="mt-4" onClick={onComplete}>View Status Dashboard</Button>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
