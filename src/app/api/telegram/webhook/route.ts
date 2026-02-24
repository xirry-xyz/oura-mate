import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sendMessage } from '@/lib/telegram'
import { type TelegramUpdate, parseCommand } from '@/lib/telegram'
import { getDailyHealth, getHealthRange, healthToSummary, healthToContext } from '@/lib/oura'
import { analyzeDaily, askQuestion } from '@/lib/ai'

export const maxDuration = 300

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
    if (allowedChatId && chatId !== allowedChatId.trim()) {
        await sendMessage(chatId, `⛔ Unauthorized.\n\nYour Chat ID is: \`${chatId}\`\nPlease update this in your Oura Mate Settings.`)
        return NextResponse.json({ ok: true })
    }

    const { command, args } = parseCommand(message.text)
    const today = new Date().toISOString().split('T')[0]

    try {
        switch (command) {
            case '/start':
            case '/help': {
                const helpText = [
                    '🔮 <b>Oura Mate — AI Health Analyzer</b>\n',
                    '📋 <b>Available Commands:</b>',
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
                    await sendMessage(chatId, `💤 <b>Sleep Data — ${today}</b>\n\n${healthToSummary({ day: today, sleep: health.sleep })}`)
                }
                break
            }

            case '/activity': {
                const health = await getDailyHealth(today)
                if (!health.activity) {
                    await sendMessage(chatId, '❌ No activity data for today.')
                } else {
                    await sendMessage(chatId, `🏃 <b>Activity — ${today}</b>\n\n${healthToSummary({ day: today, activity: health.activity })}`)
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
                let text = '📊 <b>7-Day Health Trend</b>\n\n'
                for (const h of history) {
                    text += `<b>${h.day}</b>\n${healthToContext(h)}\n\n`
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

            default: {
                if (command === '' && message.text) {
                    await sendMessage(chatId, '🤔 Thinking...')
                    const health = await getDailyHealth(today)
                    const history = await getHealthRange(7)
                    const answer = await askQuestion(message.text, health, history)
                    await sendMessage(chatId, answer)
                } else {
                    await sendMessage(chatId, `❓ Unknown command. Send /help for available commands.`)
                }
                break
            }
        }
    } catch (e) {
        console.error('Telegram command error:', e)
        await sendMessage(chatId, `⚠️ Error: ${e instanceof Error ? e.message : 'Unknown error'}`)
    }

    return NextResponse.json({ ok: true })
}
