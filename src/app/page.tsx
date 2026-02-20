import Link from "next/link"
import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { Button } from "@/components/ui/button"
import { ArrowRight, Bot, Github, Sparkles, Activity, ShieldCheck } from "lucide-react"
import { db } from "@/lib/db"

export default async function LandingPage() {
    // Determine if we should auto-redirect to /app
    // We redirect IF: it's not the official demo site AND the user has already set an admin password.
    const headersList = await headers()
    const host = headersList.get("host") || ""
    const isOfficialSite = host.includes("oura-mate.xirry.xyz") || host.includes("oura-mate.vercel.app")

    if (!isOfficialSite) {
        const hasPassword = await db.getPassword()
        if (hasPassword) {
            redirect("/app")
        }
    }

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-0 inset-x-0 h-[500px] w-full bg-gradient-to-b from-primary/10 to-transparent opacity-50 pointer-events-none" />
            <div className="absolute -top-[300px] right-[10%] w-[600px] h-[600px] bg-primary/20 blur-[100px] rounded-full pointer-events-none opacity-50" />
            <div className="absolute top-[20%] -left-[10%] w-[400px] h-[400px] bg-blue-500/10 blur-[100px] rounded-full pointer-events-none opacity-50" />

            <header className="px-6 py-4 flex items-center justify-between relative z-10 w-full max-w-7xl mx-auto">
                <div className="flex items-center gap-2 font-bold text-lg">
                    <span className="text-2xl">🔮</span> Oura Mate
                </div>
                <div className="flex items-center gap-4">
                    <a href="https://github.com/xirry-xyz/oura-mate" target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                        <Github className="h-5 w-5" />
                    </a>
                    <Button variant="outline" size="sm" asChild className="rounded-full hidden sm:flex">
                        <Link href="/app">Owner Login</Link>
                    </Button>
                </div>
            </header>

            <main className="flex-1 flex flex-col items-center justify-center relative z-10 px-4 pt-16 pb-24 w-full max-w-7xl mx-auto">
                <div className="text-center max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium border border-primary/20">
                        <Sparkles className="h-4 w-4" /> Open Source A.I. Health Analyst
                    </div>

                    <h1 className="text-5xl sm:text-7xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-foreground to-muted-foreground pb-2">
                        Your Oura Data,<br />Brilliantly Explained.
                    </h1>

                    <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                        Deploy your own personal AI health coach in one click.
                        It reads your daily Oura Ring data and sends you a personalized, actionable summary every morning via Telegram.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                        <Button size="lg" className="rounded-full px-8 text-base h-14 w-full sm:w-auto hover:scale-105 transition-transform" asChild>
                            <a href="https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fxirry-xyz%2Foura-mate&project-name=oura-mate&repository-name=oura-mate&demo-title=Oura%20Mate%20%E2%80%94%20AI%20Health%20Analyzer&demo-url=https%3A%2F%2Foura-mate.xirry.xyz">
                                ▲ Deploy to Vercel <ArrowRight className="ml-2 h-4 w-4" />
                            </a>
                        </Button>
                        <Button size="lg" variant="secondary" className="rounded-full px-8 text-base h-14 w-full sm:w-auto" asChild>
                            <Link href="/app">Configure My Instance</Link>
                        </Button>
                    </div>
                </div>

                <div className="mt-24 grid sm:grid-cols-3 gap-8 max-w-4xl mx-auto text-left w-full h-full animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-150">
                    <div className="space-y-4 p-6 rounded-2xl bg-card border border-border/50 shadow-sm">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Bot className="h-5 w-5 text-primary" />
                        </div>
                        <h3 className="font-semibold text-lg">Bring Your Own AI</h3>
                        <p className="text-muted-foreground text-sm">Choose between GPT-4o, Claude 3.5, or Gemini. You provide the API key, you control the costs.</p>
                    </div>

                    <div className="space-y-4 p-6 rounded-2xl bg-card border border-border/50 shadow-sm">
                        <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                            <ShieldCheck className="h-5 w-5 text-green-500" />
                        </div>
                        <h3 className="font-semibold text-lg">100% Private</h3>
                        <p className="text-muted-foreground text-sm">Self-hosted on your own Vercel account. Your health data and API keys never leave your personal infrastructure.</p>
                    </div>

                    <div className="space-y-4 p-6 rounded-2xl bg-card border border-border/50 shadow-sm">
                        <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                            <Activity className="h-5 w-5 text-blue-500" />
                        </div>
                        <h3 className="font-semibold text-lg">Daily Briefings</h3>
                        <p className="text-muted-foreground text-sm">Wake up to a smart Telegram message summarizing your sleep, readiness, and actionable advice for the day.</p>
                    </div>
                </div>
            </main>

            <footer className="py-6 text-center text-xs text-muted-foreground">
                <p>Designed for you. Open source under MIT License.</p>
            </footer>
        </div>
    )
}
