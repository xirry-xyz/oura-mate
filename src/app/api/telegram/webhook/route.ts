import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sendMessage } from '@/lib/telegram'
import { type TelegramUpdate, parseCommand } from '@/lib/telegram'
import { getDailyHealth, getHealthRange, healthToSummary, healthToContext } from '@/lib/oura'
import { analyzeDaily, askQuestion } from '@/lib/ai'

/**
 * POST /api/telegram/webhook — handle incoming Telegram messages.
 */
export async function POST(request: NextRequest) {
    const update: TelegramUpdate = await request.json()
    const message = update.message
    if (!message?.text) return NextResponse.json({ ok: true })

    const chatId = String(message.chat.id)
    const allowedChatId = await db.getEnv('TELEGRAM_CHAT_ID')

    // Auth check
    if (allowedChatId && chatId !== allowedChatId) {
        await sendMessage(chatId, '⛔ Unauthorized.')
        return NextResponse.json({ ok: true })
    }

    const { command, args } = parseCommand(message.text)
    const today = new Date().toISOString().split('T')[0]

    try {
        switch (command) {
            case '/start':
            case '/help': {
                const helpText = [
                    '🔮 *Oura Mate — AI Health Analyzer*\n',
                    '📋 *Available Commands:*',
                    '/today — AI health analysis',
                    '/sleep — Detailed sleep data',
                    '/activity — Activity summary',
                    '/week — 7-day trend analysis',
                    '/ask — Ask about your health',
                    '/help — Show this message',
                ].join('\n')
                await sendMessage(chatId, helpText)
                break
            }

            case '/today': {
                await sendMessage(chatId, '🔄 Analyzing health data...')
                const health = await getDailyHealth(today)
                const history = await getHealthRange(7)
                const analysis = await analyzeDaily(health, history)
                await sendMessage(chatId, analysis)
                break
            }

            case '/sleep': {
                const health = await getDailyHealth(today)
                if (!health.sleep) {
                    await sendMessage(chatId, '❌ No sleep data for today.')
                } else {
                    await sendMessage(chatId, `💤 *Sleep Data — ${today}*\n\n${healthToSummary({ day: today, sleep: health.sleep })}`)
                }
                break
            }

            case '/activity': {
                const health = await getDailyHealth(today)
                if (!health.activity) {
                    await sendMessage(chatId, '❌ No activity data for today.')
                } else {
                    await sendMessage(chatId, `🏃 *Activity — ${today}*\n\n${healthToSummary({ day: today, activity: health.activity })}`)
                }
                break
            }

            case '/week': {
                await sendMessage(chatId, '🔄 Analyzing 7-day trend...')
                const history = await getHealthRange(7)
                if (!history.length) {
                    await sendMessage(chatId, '❌ No data available.')
                    break
                }
                let text = '📊 *7-Day Health Trend*\n\n'
                for (const h of history) {
                    text += `*${h.day}*\n${healthToContext(h)}\n\n`
                }
                await sendMessage(chatId, text)
                break
            }

            case '/ask': {
                if (!args) {
                    await sendMessage(chatId, '💡 Usage: /ask <your question>\n\nExample: /ask How is my sleep quality trending?')
                    break
                }
                await sendMessage(chatId, '🤔 Thinking...')
                const health = await getDailyHealth(today)
                const history = await getHealthRange(7)
                const answer = await askQuestion(args, health, history)
                await sendMessage(chatId, answer)
                break
            }

            default:
                await sendMessage(chatId, `❓ Unknown command. Send /help for available commands.`)
        }
    } catch (e) {
        console.error('Telegram command error:', e)
        await sendMessage(chatId, `⚠️ Error: ${e instanceof Error ? e.message : 'Unknown error'}`)
    }

    return NextResponse.json({ ok: true })
}
