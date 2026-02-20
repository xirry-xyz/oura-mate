# 🔮 Oura Mate

> AI-powered daily health analysis from your Oura Ring, delivered via Telegram Bot.
> 
> Deploy your own in 5 minutes. No server needed.

## Features

- 💍 **Oura Ring** — Sleep, activity, readiness, HRV, heart rate via OAuth2
- 🧠 **Multi-AI** — OpenAI, Gemini, Claude (via [Vercel AI SDK](https://sdk.vercel.ai))
- 🤖 **Telegram Bot** — Interactive commands for instant health insights
- 📈 **7-Day Trends** — Rolling averages and personal baselines
- 🌐 **Web Setup Wizard** — Zero-code configuration
- ⏰ **Daily Reports** — Automated morning insights via Vercel Cron
- 🔒 **Self-Hosted** — Your own Vercel instance, your data

## Quick Start

### One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fxirry-xyz%2Foura-mate&project-name=oura-mate&repository-name=oura-mate&demo-title=Oura%20Mate%20%E2%80%94%20AI%20Health%20Analyzer&demo-url=https%3A%2F%2Foura-mate.xirry.xyz&env=KV_REST_API_URL,KV_REST_API_TOKEN&envDescription=Please%20create%20a%20KV%20Database%20in%20the%20Storage%20tab%20on%20Vercel%20to%20auto-fill%20these%20tokens.)

Click the button → Deploy → Visit your URL → Fill in API keys in the web UI. That's it!

### 1. Get Your Keys

| Key | Where to get it |
|-----|----------------|
| `TELEGRAM_BOT_TOKEN` | [@BotFather](https://t.me/BotFather) → `/newbot` |
| `TELEGRAM_CHAT_ID` | [@userinfobot](https://t.me/userinfobot) |
| `AI_API_KEY` | [OpenAI](https://platform.openai.com) / [Google AI Studio](https://aistudio.google.com) / [Anthropic](https://console.anthropic.com) |
| `AI_MODEL` | `gpt-4o` / `gemini-2.0-flash` / `claude-sonnet-4-20250514` |
| `OURA_CLIENT_ID` | [Oura Developer Portal](https://cloud.ouraring.com/oauth/applications) |
| `OURA_CLIENT_SECRET` | Same as above |

### 2. Connect Oura

1. Visit your deployed URL → follow the setup wizard
2. Click **Connect Oura Ring** → authorize
3. Click **Activate Bot** → webhook registered
4. Send `/today` in Telegram 🎉

### 3. Optional: Persistent Storage

Add [Upstash Redis](https://vercel.com/marketplace/upstash-redis) from Vercel Marketplace for persistent token storage. Without it, tokens are stored in memory and will reset on cold start.

### 4. Optional: Daily Reports

Vercel Cron sends a daily report at 9 AM Beijing time. Set `CRON_SECRET` in Vercel env for security.

## Telegram Commands

| Command | Description |
|---------|------------|
| `/today` | AI health analysis for today |
| `/sleep` | Detailed sleep data |
| `/activity` | Activity summary |
| `/week` | 7-day trend analysis |
| `/ask <question>` | Free-form health Q&A |
| `/help` | Show all commands |

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **UI**: shadcn/ui + Tailwind CSS
- **AI**: Vercel AI SDK
- **Storage**: Upstash Redis
- **Deploy**: Vercel
- **Cron**: Vercel Cron Jobs

## License

MIT
