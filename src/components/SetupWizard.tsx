"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle2, Circle, ExternalLink, AlertCircle, PartyPopper, Rocket, Copy, Check } from "lucide-react"

interface Status {
    configured: boolean
    oura: { configured: boolean; authorized: boolean; client_id: boolean; client_secret: boolean }
    telegram: { configured: boolean; bot_token: boolean; chat_id: boolean }
    ai: { configured: boolean; model: string; api_key: boolean }
    base_url: string
}

interface SetupWizardProps {
    status: Status | null
    onComplete: () => void
    success: string | null
    error: string | null
}

export function SetupWizard({ status, onComplete, success, error }: SetupWizardProps) {
    const [connectingOura, setConnectingOura] = useState(false)
    const [settingUpWebhook, setSettingUpWebhook] = useState(false)
    const [copied, setCopied] = useState("")

    const handleConnectOura = async () => {
        setConnectingOura(true)
        try {
            const res = await fetch("/api/oura/auth")
            const data = await res.json()
            window.location.href = data.auth_url
        } catch {
            setConnectingOura(false)
        }
    }

    const handleSetupWebhook = async () => {
        setSettingUpWebhook(true)
        try {
            await fetch("/api/telegram/setup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
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

    const steps = [
        { id: "telegram", title: "Telegram Bot", completed: status?.telegram?.configured ?? false, icon: "🤖" },
        { id: "ai", title: "AI Provider", completed: status?.ai?.configured ?? false, icon: "🧠" },
        { id: "oura", title: "Oura Ring", completed: status?.oura?.authorized ?? false, icon: "💍" },
        { id: "webhook", title: "Activate Bot", completed: false, icon: "🚀" },
    ]

    const completedCount = steps.filter(s => s.completed).length

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
                                : `Error: ${error}`}
                    </AlertDescription>
                </Alert>
            )}

            {/* Progress */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Setup Progress</CardTitle>
                    <CardDescription>{completedCount}/4 steps completed</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-2">
                        {steps.map((step) => (
                            <div key={step.id} className={`h-2 flex-1 rounded-full transition-colors ${step.completed ? "bg-green-500" : "bg-muted"}`} />
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Deploy Instructions */}
            <Card className="border-blue-500/30 bg-blue-500/5">
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <Rocket className="h-5 w-5 text-blue-500" />
                        <div>
                            <CardTitle className="text-base">How to Deploy</CardTitle>
                            <CardDescription className="mt-1">Fork this project to your own Vercel</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="pt-0 space-y-4">
                    <Separator />
                    <div className="space-y-3 text-sm text-muted-foreground">
                        <div className="flex gap-3">
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-blue-500 text-xs font-bold">1</span>
                            <p>Go to the <a href="https://github.com/x1rry/oura-mate" target="_blank" className="text-primary underline">GitHub repo</a>, click <strong className="text-foreground">Fork</strong></p>
                        </div>
                        <div className="flex gap-3">
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-blue-500 text-xs font-bold">2</span>
                            <p>Go to <a href="https://vercel.com/new" target="_blank" className="text-primary underline">vercel.com/new</a>, click <strong className="text-foreground">Import</strong> your forked repo</p>
                        </div>
                        <div className="flex gap-3">
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-blue-500 text-xs font-bold">3</span>
                            <p>Add environment variables (see steps below for each key), then click <strong className="text-foreground">Deploy</strong></p>
                        </div>
                        <div className="flex gap-3">
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-blue-500 text-xs font-bold">4</span>
                            <p>Visit your deployed URL to continue setup here</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Step 1: Telegram */}
            <Card className={steps[0].completed ? "border-green-500/30" : ""}>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className="text-2xl">{steps[0].icon}</span>
                            <div>
                                <CardTitle className="text-base flex items-center gap-2">
                                    Step 1: Telegram Bot
                                    {steps[0].completed && <Badge variant="secondary" className="bg-green-500/10 text-green-500 text-xs">Done</Badge>}
                                </CardTitle>
                                <CardDescription className="mt-1">Create a Telegram bot</CardDescription>
                            </div>
                        </div>
                        {steps[0].completed ? <CheckCircle2 className="h-5 w-5 text-green-500" /> : <Circle className="h-5 w-5 text-muted-foreground" />}
                    </div>
                </CardHeader>
                {!steps[0].completed && (
                    <CardContent className="pt-0">
                        <Separator className="mb-4" />
                        <div className="space-y-3 text-sm text-muted-foreground">
                            <p>1. Open Telegram, search <code className="bg-muted px-1.5 py-0.5 rounded text-xs">@BotFather</code></p>
                            <p>2. Send <code className="bg-muted px-1.5 py-0.5 rounded text-xs">/newbot</code> and follow prompts</p>
                            <p>3. Copy the token → add as <code className="bg-muted px-1.5 py-0.5 rounded text-xs">TELEGRAM_BOT_TOKEN</code> in Vercel env</p>
                            <p>4. Message <code className="bg-muted px-1.5 py-0.5 rounded text-xs">@userinfobot</code> to get Chat ID → add as <code className="bg-muted px-1.5 py-0.5 rounded text-xs">TELEGRAM_CHAT_ID</code></p>
                        </div>
                        <div className="mt-4 flex gap-2">
                            <Button variant="outline" size="sm" asChild>
                                <a href="https://t.me/BotFather" target="_blank"><ExternalLink className="mr-1 h-3 w-3" /> BotFather</a>
                            </Button>
                            <Button variant="outline" size="sm" asChild>
                                <a href="https://t.me/userinfobot" target="_blank"><ExternalLink className="mr-1 h-3 w-3" /> UserInfoBot</a>
                            </Button>
                        </div>
                    </CardContent>
                )}
            </Card>

            {/* Step 2: AI */}
            <Card className={steps[1].completed ? "border-green-500/30" : ""}>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className="text-2xl">{steps[1].icon}</span>
                            <div>
                                <CardTitle className="text-base flex items-center gap-2">
                                    Step 2: AI Provider
                                    {steps[1].completed && <Badge variant="secondary" className="bg-green-500/10 text-green-500 text-xs">Done</Badge>}
                                </CardTitle>
                                <CardDescription className="mt-1">Choose an AI model and set API key</CardDescription>
                            </div>
                        </div>
                        {steps[1].completed ? <CheckCircle2 className="h-5 w-5 text-green-500" /> : <Circle className="h-5 w-5 text-muted-foreground" />}
                    </div>
                </CardHeader>
                {!steps[1].completed && (
                    <CardContent className="pt-0">
                        <Separator className="mb-4" />
                        <div className="space-y-3 text-sm text-muted-foreground">
                            <p>Pick one provider and add <code className="bg-muted px-1.5 py-0.5 rounded text-xs">AI_API_KEY</code> + <code className="bg-muted px-1.5 py-0.5 rounded text-xs">AI_MODEL</code> in Vercel:</p>
                            <div className="grid grid-cols-2 gap-2">
                                {[
                                    { name: "OpenAI", model: "gpt-4o", url: "https://platform.openai.com" },
                                    { name: "Google Gemini", model: "gemini-2.0-flash", url: "https://aistudio.google.com" },
                                    { name: "Anthropic Claude", model: "claude-sonnet-4-20250514", url: "https://console.anthropic.com" },
                                    { name: "Ollama (local)", model: "ollama/llama3", url: "https://ollama.ai" },
                                ].map(p => (
                                    <button key={p.name} onClick={() => copyText(p.model, p.model)} className="rounded-lg border p-3 text-left hover:bg-muted/50 transition-colors">
                                        <p className="font-medium text-foreground text-xs">{p.name}</p>
                                        <div className="flex items-center gap-1 mt-1">
                                            <code className="text-[10px] bg-muted px-1 rounded">{p.model}</code>
                                            {copied === p.model ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3 text-muted-foreground" />}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                )}
            </Card>

            {/* Step 3: Oura */}
            <Card className={steps[2].completed ? "border-green-500/30" : ""}>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className="text-2xl">{steps[2].icon}</span>
                            <div>
                                <CardTitle className="text-base flex items-center gap-2">
                                    Step 3: Oura Ring
                                    {steps[2].completed && <Badge variant="secondary" className="bg-green-500/10 text-green-500 text-xs">Done</Badge>}
                                </CardTitle>
                                <CardDescription className="mt-1">Connect your Oura Ring</CardDescription>
                            </div>
                        </div>
                        {steps[2].completed ? <CheckCircle2 className="h-5 w-5 text-green-500" /> : <Circle className="h-5 w-5 text-muted-foreground" />}
                    </div>
                </CardHeader>
                {!steps[2].completed && (
                    <CardContent className="pt-0">
                        <Separator className="mb-4" />
                        <div className="space-y-3 text-sm text-muted-foreground">
                            <p>1. Go to <a href="https://cloud.ouraring.com/oauth/applications" target="_blank" className="text-primary underline">Oura Developer Portal</a>, create an app</p>
                            <p>2. Set Redirect URI to:</p>
                            <div className="flex items-center gap-2">
                                <code className="bg-muted px-2 py-1 rounded text-xs break-all flex-1">{status?.base_url}/api/oura/callback</code>
                                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => copyText(`${status?.base_url}/api/oura/callback`, "redirect")}>
                                    {copied === "redirect" ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                                </Button>
                            </div>
                            <p>3. Copy Client ID/Secret → add as <code className="bg-muted px-1.5 py-0.5 rounded text-xs">OURA_CLIENT_ID</code> / <code className="bg-muted px-1.5 py-0.5 rounded text-xs">OURA_CLIENT_SECRET</code> in Vercel, then <strong className="text-foreground">redeploy</strong></p>
                            <p>4. Click the button below to authorize:</p>
                        </div>
                        <div className="mt-4">
                            {status?.oura?.configured ? (
                                <Button onClick={handleConnectOura} disabled={connectingOura}>
                                    {connectingOura ? "Redirecting..." : "🔗 Connect Oura Ring"}
                                </Button>
                            ) : (
                                <Button disabled variant="secondary">Set OURA_CLIENT_ID first, then redeploy</Button>
                            )}
                        </div>
                    </CardContent>
                )}
            </Card>

            {/* Step 4: Activate */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className="text-2xl">{steps[3].icon}</span>
                            <div>
                                <CardTitle className="text-base">Step 4: Activate Bot</CardTitle>
                                <CardDescription className="mt-1">Register the Telegram webhook</CardDescription>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="pt-0">
                    <Separator className="mb-4" />
                    <p className="text-sm text-muted-foreground mb-4">
                        This connects your Telegram bot to this server. After clicking, your bot will start responding to commands.
                    </p>
                    <Button
                        onClick={handleSetupWebhook}
                        disabled={settingUpWebhook || !status?.telegram?.configured}
                    >
                        {settingUpWebhook ? "Setting up..." : "⚡ Activate Telegram Bot"}
                    </Button>
                </CardContent>
            </Card>

            {/* All done */}
            {completedCount >= 3 && (
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
