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

### 1. Fork & Deploy

1. **Fork** this repo on GitHub
2. Go to [vercel.com/new](https://vercel.com/new) → **Import** your fork
3. Add environment variables (see below)
4. Click **Deploy**

### 2. Get Your Keys

| Key | Where to get it |
|-----|----------------|
| `TELEGRAM_BOT_TOKEN` | [@BotFather](https://t.me/BotFather) → `/newbot` |
| `TELEGRAM_CHAT_ID` | [@userinfobot](https://t.me/userinfobot) |
| `AI_API_KEY` | [OpenAI](https://platform.openai.com) / [Google AI Studio](https://aistudio.google.com) / [Anthropic](https://console.anthropic.com) |
| `AI_MODEL` | `gpt-4o` / `gemini-2.0-flash` / `claude-sonnet-4-20250514` |
| `OURA_CLIENT_ID` | [Oura Developer Portal](https://cloud.ouraring.com/oauth/applications) |
| `OURA_CLIENT_SECRET` | Same as above |

### 3. Connect Oura

1. Visit your deployed URL → follow the setup wizard
2. Click **Connect Oura Ring** → authorize
3. Click **Activate Bot** → webhook registered
4. Send `/today` in Telegram 🎉

### 4. Optional: Persistent Storage

Add [Upstash Redis](https://vercel.com/marketplace/upstash-redis) from Vercel Marketplace for persistent token storage. Without it, tokens are stored in memory and will reset on cold start.

### 5. Optional: Daily Reports

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
