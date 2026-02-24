import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getDailyHealth, getHealthRange } from '@/lib/oura'
import { analyzeDaily } from '@/lib/ai'
import { sendMessage } from '@/lib/telegram'

export const maxDuration = 300

/**
 * GET /api/cron/daily — Vercel Cron: daily health report.
 * Secured by CRON_SECRET header.
 */
export async function GET(request: Request) {
    // Verify cron secret
    const authHeader = request.headers.get('authorization')
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const chatId = await db.getEnv('TELEGRAM_CHAT_ID')
    if (!chatId) return NextResponse.json({ error: 'TELEGRAM_CHAT_ID not set' }, { status: 400 })

    const targetHour = parseInt(await db.getEnv('CRON_SCHEDULE_TIME') || '8', 10)
    const targetTz = await db.getEnv('CRON_TIMEZONE') || 'Asia/Shanghai'

    // Get current hour in user's timezone
    const nowLocal = new Date().toLocaleString("en-US", { timeZone: targetTz })
    const currentHour = new Date(nowLocal).getHours()

    if (currentHour !== targetHour) {
        return NextResponse.json({ ok: true, skipped: true, reason: `Current hour ${currentHour} != target ${targetHour}` })
    }

    try {
        const today = new Date().toISOString().split('T')[0]
        const health = await getDailyHealth(today)
        const history = await getHealthRange(7)
        const analysis = await analyzeDaily(health, history)

        await sendMessage(chatId, `📅 <b>Daily Health Report — ${today}</b>\n\n${analysis}`)

        return NextResponse.json({ ok: true, date: today })
    } catch (e) {
        console.error('Cron error:', e)
        return NextResponse.json({ error: String(e) }, { status: 500 })
    }
}
