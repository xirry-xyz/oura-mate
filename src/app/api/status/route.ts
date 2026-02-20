import { NextResponse } from 'next/server'
import { isAuthorized } from '@/lib/oura'

export async function GET() {
    const ouraConnected = await isAuthorized()

    return NextResponse.json({
        configured: !!(
            process.env.TELEGRAM_BOT_TOKEN &&
            process.env.AI_API_KEY &&
            process.env.OURA_CLIENT_ID
        ),
        oura: {
            configured: !!(process.env.OURA_CLIENT_ID && process.env.OURA_CLIENT_SECRET),
            authorized: ouraConnected,
            client_id: !!process.env.OURA_CLIENT_ID,
            client_secret: !!process.env.OURA_CLIENT_SECRET,
        },
        telegram: {
            configured: !!process.env.TELEGRAM_BOT_TOKEN,
            bot_token: !!process.env.TELEGRAM_BOT_TOKEN,
            chat_id: !!process.env.TELEGRAM_CHAT_ID,
        },
        ai: {
            configured: !!process.env.AI_API_KEY,
            model: process.env.AI_MODEL || 'gpt-4o',
            api_key: !!process.env.AI_API_KEY,
        },
        base_url: getBaseUrl(),
    })
}

function getBaseUrl(): string {
    if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
    if (process.env.NEXT_PUBLIC_BASE_URL) return process.env.NEXT_PUBLIC_BASE_URL
    return `http://localhost:${process.env.PORT || 3000}`
}
