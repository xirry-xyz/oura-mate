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

## Quick Start / 快速开始

### 1. One-Click Deploy / 一键部署

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fxirry-xyz%2Foura-mate&project-name=oura-mate&repository-name=oura-mate&demo-title=Oura%20Mate%20%E2%80%94%20AI%20Health%20Analyzer&demo-url=https%3A%2F%2Foura-mate.xirry.xyz&envDescription=Please%20click%20Storage%20-%3E%20Upstash%20Redis%20in%20your%20Vercel%20dashboard%20to%20auto-fill%20these%20tokens.)

- **EN**:
  1. Click the **Deploy** button above.
  2. **Important Database Step:** Vercel will ask you to fill in `KV_REST_API_URL` and `KV_REST_API_TOKEN`. 
     - You cannot fill these in manually right now. **Leave them blank or type "temp"**, and click **Deploy**.
     - After the initial deployment finishes (it might show an error, which is fine), go to your Vercel Project Dashboard.
     - Click the **Storage** tab at the top.
     - Click **Create Database** -> select **KV (Redis)** -> accept the terms and click Create.
     - Vercel will automatically inject the `KV_REST_API_URL` and `KV_REST_API_TOKEN` into your environment variables.
     - Go to the **Deployments** tab, click the three dots on your latest deployment, and click **Redeploy**. Your app is now successfully connected to the database!
  3. Go to the **Settings -> Environment Variables** tab in your Vercel Dashboard to add the rest of your keys (see below). After deployment, visit your URL and you will be greeted by the Setup Wizard.
- **ZH**: 
  1. 点击上方 **Deploy** 按钮，一键克隆到你自己的 Vercel 账号下。
  2. **重要数据库步骤（必看）：** 直接点击 Deploy 部署（如果报错不用管）。部署初始页面后，进入你的 Vercel 项目控制台。
     - 点击顶部的 **Storage** 标签页。
     - 点击 **Create Database** -> 选择 **KV (Redis)** -> 接受条款并点击创建。
     - Vercel 会自动将 `KV_REST_API_URL` 和 `KV_REST_API_TOKEN` 填入你的环境变量中。
     - 去到 **Deployments** 标签页，点击最新那次部署右侧的三个点，选择 **Redeploy** 重新部署。你的应用现在已成功连接数据库！
  3. 前往 Vercel 的 **Settings -> Environment Variables** 继续添加剩余的环境变量。部署完成后，访问你的专属网址，即可进入可视化的配置指引页面。

---

### 2. Getting Your API Keys / 获取必备的 API 密钥

To power your AI health coach, you will need a few free configurations. 
为了让你的 AI 健康私教运转起来，你需要准备以下免费的配置项：

#### 🤖 Telegram Bot (Bot Token & Chat ID)
- **EN**: 
  1. Go to Telegram and search for [@BotFather](https://t.me/BotFather). Send `/newbot`, follow the prompts, and you will get your **Bot Token**.
  2. Search for the bot you just created, say "Hello" to it.
  3. Search for [@userinfobot](https://t.me/userinfobot) and send `/start`. It will reply with your numeric **Chat ID**.
- **ZH**:
  1. 打开 Telegram，搜索 [@BotFather](https://t.me/BotFather)，发送 `/newbot`，按提示起个名字，最后它会发给你一串 **Bot Token**。
  2. 搜索你刚刚创建的机器人名字，进去和它随便说句话（比如 "Hello"）。
  3. 接着搜索 [@userinfobot](https://t.me/userinfobot)，发送 `/start`，它会回复一串纯数字的 **Chat ID**。

#### 🧠 AI Provider (API Key & Model)
- **EN**: Choose your preferred frontend model (e.g., `gpt-5.2`, `claude-4-6-sonnet-20260217`, `gemini-3.1-pro`).
  - **OpenAI**: Get your key at [platform.openai.com](https://platform.openai.com).
  - **Anthropic**: Get your key at [console.anthropic.com](https://console.anthropic.com).
  - **Google**: Get your key at [aistudio.google.com](https://aistudio.google.com).
- **ZH**: 选择你喜欢的前沿大模型（例如目前最新的 `gpt-5.2`、`claude-4.6` 或者 `gemini-3.1`）。
  - **OpenAI**: 在 [platform.openai.com](https://platform.openai.com) 获取。
  - **Anthropic**: 在 [console.anthropic.com](https://console.anthropic.com) 获取。
  - **Google Gemini**: 在 [aistudio.google.com](https://aistudio.google.com) 免费申请。

#### 💍 Oura Ring (Client ID & Secret)
- **EN**:
  1. Visit the [Oura Developer Portal](https://developer.ouraring.com/applications) and sign in.
  2. Click "New Application". Fill in any name.
  3. For the **Redirect URI**, you MUST enter: `https://<YOUR-VERCEL-DOMAIN>/api/oura/callback`.
  4. Save to get your **Client ID** and **Client Secret**.
- **ZH**:
  1. 登录 [Oura 开发者后台](https://developer.ouraring.com/applications)。
  2. 点击 "New Application" 创建一个新应用，名字随便填。
  3. 在 **Redirect URIs** 这一栏，必须填入：`https://<你刚刚部署出来的Vercel网址>/api/oura/callback`。
  4. 保存后，你就能拿到专属的 **Client ID** 和 **Client Secret** 了。

---

### 3. Complete Web Setup / 在网页中完成配置

- **EN**: Open your deployed Vercel URL. You will first be asked to create a secure Admin Password. Then, paste all the keys you gathered above into the wizard. Click "Save", click "Connect Oura Ring" to authorize your health data, and finally click "Activate Bot".
- **ZH**: 打开你部署的 Vercel 网址。第一次进入由于系统保护，需要你先设置一个管理员密码。进入后，把你刚才获取到的所有秘钥填进去，点击保存。之后依次点击 "Connect Oura Ring" 完成账号授权，然后点击 "Activate Bot" 激活机器人回调。大功告成！

### 4. Talk to your Bot / 开始聊天

- **EN**: Go to your Telegram bot and send `/today` to get your first AI analysis!
- **ZH**: 回到 Telegram，向你的机器人发送 `/today` 命令，获取你的第一份私人健康诊断简报吧！🎉

---

## Telegram Commands / 常用命令

| Command | Description (EN) | 功能说明 (ZH) |
|---------|------------------|-------------|
| `/today` | AI health analysis for today | 今日人工智能健康诊断总结 |
| `/sleep` | Detailed sleep data | 昨晚详细睡眠数据折线图 |
| `/activity` | Activity summary | 运动与热量消耗概览 |
| `/week` | 7-day trend analysis | 过去7天趋势分析与建议 |
| `/ask` | Free-form health Q&A | 自由提问一切健康相关问题 |
| `/help` | Show all commands | 显示全部可用命令 |

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **UI**: shadcn/ui + Tailwind CSS
- **AI**: Vercel AI SDK
- **Storage**: Upstash Redis
- **Deploy**: Vercel
- **Cron**: Vercel Cron Jobs

## License

MIT
