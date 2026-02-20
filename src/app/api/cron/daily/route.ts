import { NextResponse } from 'next/server'
import { sendMessage } from '@/lib/telegram'
import { getDailyHealth, getHealthRange, isAuthorized } from '@/lib/oura'
import { analyzeDaily } from '@/lib/ai'

/**
 * Vercel Cron job for daily health report.
 * Triggered by vercel.json cron schedule.
 */
export async function GET(request: Request) {
    // Verify cron secret (Vercel sends this header)
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const chatId = process.env.TELEGRAM_CHAT_ID
    if (!chatId) {
        return NextResponse.json({ error: 'TELEGRAM_CHAT_ID not set' }, { status: 400 })
    }

    if (!await isAuthorized()) {
        return NextResponse.json({ error: 'Oura not authorized' }, { status: 400 })
    }

    try {
        const today = new Date().toISOString().split('T')[0]
        const todayHealth = await getDailyHealth(today)
        const history = await getHealthRange(7)
        const analysis = await analyzeDaily(todayHealth, history)

        await sendMessage(chatId, `🌅 *Good Morning! Daily Health Report*\n\n${analysis}`)

        return NextResponse.json({ ok: true, date: today })
    } catch (e) {
        console.error('Cron daily report error:', e)
        return NextResponse.json({ error: String(e) }, { status: 500 })
    }
}
