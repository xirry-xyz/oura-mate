"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Bot, Github, Sparkles, Activity, ShieldCheck, Globe, Check } from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const dict = {
    en: {
        title: "Oura Mate",
        badge: "Open Source A.I. Health Analyst",
        h1_1: "Your Oura Data,",
        h1_2: "Brilliantly Explained.",
        subtitle: "Deploy your own personal AI health coach in one click. It reads your daily Oura Ring data and sends you a personalized, actionable summary every morning via Telegram.",
        deploy: "Deploy to Vercel",
        configure: "Configure My Instance",
        login: "Log In",
        feature1_title: "Bring Your Own AI",
        feature1_desc: "Choose between GPT-4o, Claude 3.5, or Gemini. You provide the API key, you control the costs.",
        feature2_title: "100% Private",
        feature2_desc: "Self-hosted on your own Vercel account. Your health data and API keys never leave your personal infrastructure.",
        feature3_title: "Daily Briefings",
        feature3_desc: "Wake up to a smart Telegram message summarizing your sleep, readiness, and actionable advice for the day.",
        footer: "Designed for you. Open source under MIT License."
    },
    zh: {
        title: "Oura Mate",
        badge: "开源的 A.I. 健康分析师",
        h1_1: "让你的 Oura 数据，",
        h1_2: "开始说人话。",
        subtitle: "一键部署你个人的 AI 健康私教。它每天会读取并分析你的 Oura Ring 数据，经过思考后，每天早晨通过 Telegram 给你发送一份个性化、可执行的中文健康简报。",
        deploy: "部署到 Vercel",
        configure: "配置我的实例",
        login: "登录后台",
        feature1_title: "自带大模型密钥",
        feature1_desc: "支持 GPT-4o, Claude 3.5 或是 Gemini。由于你自带 API 密钥，你的使用成本几乎为零。",
        feature2_title: "100% 隐私安全",
        feature2_desc: "完全部署在你自己的 Vercel 账号上。你的健康数据和 API 密钥永远不会离开你的个人基础设施服务器。",
        feature3_title: "每日清晨简报",
        feature3_desc: "伴随早晨的第一杯咖啡，在 Telegram 收到一条聪慧的推送，总结你昨晚的睡眠、今天的活力以及量身定制的行动建议。",
        footer: "为你设计。采用 MIT 协议开源。"
    }
}

export default function LandingClient({ hasPassword }: { hasPassword?: boolean }) {
    const [lang, setLang] = useState<"en" | "zh">("en")
    const t = dict[lang]

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-0 inset-x-0 h-[500px] w-full bg-gradient-to-b from-primary/10 to-transparent opacity-50 pointer-events-none" />
            <div className="absolute -top-[300px] right-[10%] w-[600px] h-[600px] bg-primary/20 blur-[100px] rounded-full pointer-events-none opacity-50" />
            <div className="absolute top-[20%] -left-[10%] w-[400px] h-[400px] bg-blue-500/10 blur-[100px] rounded-full pointer-events-none opacity-50" />

            <header className="px-6 py-4 flex items-center justify-between relative z-10 w-full max-w-7xl mx-auto">
                <div className="flex items-center gap-2 font-bold text-lg">
                    <span className="text-2xl">🔮</span> {t.title}
                </div>
                <div className="flex items-center gap-4">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                                <Globe className="h-5 w-5" />
                                <span className="sr-only">Toggle language</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setLang("en")} className="flex items-center justify-between">
                                English
                                {lang === "en" && <Check className="h-3 w-3 ml-2" />}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setLang("zh")} className="flex items-center justify-between">
                                中文
                                {lang === "zh" && <Check className="h-3 w-3 ml-2" />}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <a href="https://github.com/xirry-xyz/oura-mate" target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                        <Github className="h-5 w-5" />
                    </a>

                    {hasPassword && (
                        <Button variant="outline" size="sm" asChild className="rounded-full hidden sm:flex ml-2">
                            <Link href="/app">{t.login}</Link>
                        </Button>
                    )}
                </div>
            </header>

            <main className="flex-1 flex flex-col items-center justify-center relative z-10 px-4 pt-16 pb-24 w-full max-w-7xl mx-auto">
                <div className="text-center max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium border border-primary/20 mb-2">
                        <Sparkles className="h-4 w-4" /> {t.badge}
                    </div>

                    <h1 className="text-5xl sm:text-7xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-foreground to-muted-foreground pb-2 leading-tight">
                        {t.h1_1}<br />{t.h1_2}
                    </h1>

                    <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                        {t.subtitle}
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                        <Button size="lg" className="rounded-full px-8 text-base h-14 w-full sm:w-auto hover:scale-105 transition-transform" asChild>
                            <a href="https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fxirry-xyz%2Foura-mate&project-name=oura-mate&repository-name=oura-mate&demo-title=Oura%20Mate%20%E2%80%94%20AI%20Health%20Analyzer&demo-url=https%3A%2F%2Foura-mate.xirry.xyz&env=KV_REST_API_URL,KV_REST_API_TOKEN&envDescription=Please%20click%20Storage%20-%3E%20Upstash%20Redis%20in%20your%20Vercel%20dashboard%20to%20auto-fill%20these%20tokens.">
                                ▲ {t.deploy} <ArrowRight className="ml-2 h-4 w-4" />
                            </a>
                        </Button>
                        {!hasPassword && (
                            <Button size="lg" variant="secondary" className="rounded-full px-8 text-base h-14 w-full sm:w-auto" asChild>
                                <Link href="/app">{t.configure}</Link>
                            </Button>
                        )}
                    </div>
                </div>

                <div className="mt-24 grid sm:grid-cols-3 gap-8 max-w-4xl mx-auto text-left w-full h-full animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-150">
                    <div className="space-y-4 p-6 rounded-2xl bg-card border border-border/50 shadow-sm">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Bot className="h-5 w-5 text-primary" />
                        </div>
                        <h3 className="font-semibold text-lg">{t.feature1_title}</h3>
                        <p className="text-muted-foreground text-sm leading-relaxed">{t.feature1_desc}</p>
                    </div>

                    <div className="space-y-4 p-6 rounded-2xl bg-card border border-border/50 shadow-sm">
                        <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                            <ShieldCheck className="h-5 w-5 text-green-500" />
                        </div>
                        <h3 className="font-semibold text-lg">{t.feature2_title}</h3>
                        <p className="text-muted-foreground text-sm leading-relaxed">{t.feature2_desc}</p>
                    </div>

                    <div className="space-y-4 p-6 rounded-2xl bg-card border border-border/50 shadow-sm">
                        <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                            <Activity className="h-5 w-5 text-blue-500" />
                        </div>
                        <h3 className="font-semibold text-lg">{t.feature3_title}</h3>
                        <p className="text-muted-foreground text-sm leading-relaxed">{t.feature3_desc}</p>
                    </div>
                </div>
            </main>

            <footer className="py-6 text-center text-xs text-muted-foreground">
                <p>{t.footer}</p>
            </footer>
        </div>
    )
}
