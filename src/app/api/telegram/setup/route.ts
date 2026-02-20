import { NextRequest, NextResponse } from 'next/server'
import { setWebhook, getWebhookInfo, deleteWebhook } from '@/lib/telegram'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
    const { action } = await request.json()

    const botToken = await db.getEnv('TELEGRAM_BOT_TOKEN')
    if (!botToken) {
        return NextResponse.json({ error: 'Bot token not configured' }, { status: 400 })
    }

    const baseUrl = process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : process.env.NEXT_PUBLIC_BASE_URL || `http://localhost:3000`

    const webhookUrl = `${baseUrl}/api/telegram/webhook`

    if (action === 'setup') {
        const ok = await setWebhook(webhookUrl)
        return NextResponse.json({ ok, webhook_url: webhookUrl })
    }

    if (action === 'remove') {
        const ok = await deleteWebhook()
        return NextResponse.json({ ok })
    }

    if (action === 'status') {
        const info = await getWebhookInfo()
        return NextResponse.json(info)
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
