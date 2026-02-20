import { NextRequest, NextResponse } from 'next/server'
import { sendMessage, parseCommand, type TelegramUpdate } from '@/lib/telegram'
import { getDailyHealth, getHealthRange, isAuthorized, healthToSummary } from '@/lib/oura'
import { analyzeDaily, askQuestion } from '@/lib/ai'

export async function POST(request: NextRequest) {
    const update: TelegramUpdate = await request.json()

    // Verify chat ID authorization
    const chatId = update.message?.chat.id
    if (!chatId) return NextResponse.json({ ok: true })

    const allowedChatId = process.env.TELEGRAM_CHAT_ID
    if (allowedChatId && String(chatId) !== allowedChatId) {
        await sendMessage(String(chatId), '⛔ Unauthorized. This bot is private.')
        return NextResponse.json({ ok: true })
    }

    const parsed = parseCommand(update)
    if (!parsed) return NextResponse.json({ ok: true })

    const cid = String(chatId)

    try {
        switch (parsed.command) {
            case '/start':
            case '/help':
                await sendMessage(cid,
                    '👋 *Welcome to Oura Mate!*\n\n' +
                    'I analyze your Oura Ring data with AI.\n\n' +
                    '📋 *Commands:*\n' +
                    '/today — AI health analysis\n' +
                    '/sleep — Sleep data\n' +
                    '/activity — Activity data\n' +
                    '/week — 7-day trend\n' +
                    '/ask — Ask about your health\n' +
                    '/help — Show this message'
                )
                break

            case '/today':
                if (!await isAuthorized()) {
                    await sendMessage(cid, '⚠️ Oura not connected. Visit the setup page to authorize.')
                    break
                }
                await sendMessage(cid, '🔄 Analyzing your health data...')
                const todayStr = new Date().toISOString().split('T')[0]
                const todayHealth = await getDailyHealth(todayStr)
                const history = await getHealthRange(7)
                const analysis = await analyzeDaily(todayHealth, history)
                await sendMessage(cid, analysis)
                break

            case '/sleep':
                if (!await isAuthorized()) {
                    await sendMessage(cid, '⚠️ Oura not connected.')
                    break
                }
                const sleepDate = new Date().toISOString().split('T')[0]
                const sleepHealth = await getDailyHealth(sleepDate)
                if (sleepHealth.sleep) {
                    await sendMessage(cid, `💤 *Sleep Report*\n\n${healthToSummary({ day: sleepDate, sleep: sleepHealth.sleep })}`)
                } else {
                    await sendMessage(cid, '📭 No sleep data available yet.')
                }
                break

            case '/activity':
                if (!await isAuthorized()) {
                    await sendMessage(cid, '⚠️ Oura not connected.')
                    break
                }
                const actDate = new Date().toISOString().split('T')[0]
                const actHealth = await getDailyHealth(actDate)
                if (actHealth.activity) {
                    await sendMessage(cid, `🏃 *Activity Report*\n\n${healthToSummary({ day: actDate, activity: actHealth.activity })}`)
                } else {
                    await sendMessage(cid, '📭 No activity data available yet.')
                }
                break

            case '/week':
                if (!await isAuthorized()) {
                    await sendMessage(cid, '⚠️ Oura not connected.')
                    break
                }
                await sendMessage(cid, '🔄 Analyzing 7-day trend...')
                const weekHistory = await getHealthRange(7)
                if (weekHistory.length === 0) {
                    await sendMessage(cid, '📭 No data for the past 7 days.')
                    break
                }
                const weekAnalysis = await analyzeDaily(weekHistory[weekHistory.length - 1], weekHistory)
                await sendMessage(cid, `📈 *7-Day Trend Analysis*\n\n${weekAnalysis}`)
                break

            case '/ask':
                if (!await isAuthorized()) {
                    await sendMessage(cid, '⚠️ Oura not connected.')
                    break
                }
                if (!parsed.args) {
                    await sendMessage(cid, '💬 Usage: /ask <your question>\n\nExample: /ask 为什么我昨晚深睡这么少？')
                    break
                }
                await sendMessage(cid, '🤔 Thinking...')
                const askDate = new Date().toISOString().split('T')[0]
                const askHealth = await getDailyHealth(askDate)
                const askHistory = await getHealthRange(7)
                const answer = await askQuestion(parsed.args, askHealth, askHistory)
                await sendMessage(cid, answer)
                break

            default:
                await sendMessage(cid, '❓ Unknown command. Send /help for available commands.')
        }
    } catch (e) {
        console.error('Bot error:', e)
        await sendMessage(cid, `❌ Error: ${e instanceof Error ? e.message : String(e)}`)
    }

    return NextResponse.json({ ok: true })
}
