import { NextResponse, NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { isAuthorized } from '@/lib/oura'

/**
 * GET /api/status — Return config and connection status.
 */
export async function GET(request: NextRequest) {
    const [botToken, chatId, aiKey, aiModel, ouraId, ouraSecret] = await Promise.all([
        db.getEnv('TELEGRAM_BOT_TOKEN'),
        db.getEnv('TELEGRAM_CHAT_ID'),
        db.getEnv('AI_API_KEY'),
        db.getEnv('AI_MODEL'),
        db.getEnv('OURA_CLIENT_ID'),
        db.getEnv('OURA_CLIENT_SECRET'),
    ])

    const ouraAuthorized = await isAuthorized()

    // Dynamically determine base URL from request to support forked deployments correctly
    const protocol = request.headers.get('x-forwarded-proto') || 'http'
    const host = request.headers.get('host') || 'localhost:3000'
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `${protocol}://${host}`

    return NextResponse.json({
        configured: !!(botToken && chatId && aiKey && ouraId && ouraAuthorized),
        oura: {
            configured: !!(ouraId && ouraSecret),
            authorized: ouraAuthorized,
            client_id: !!ouraId,
            client_secret: !!ouraSecret,
        },
        telegram: {
            configured: !!(botToken && chatId),
            bot_token: !!botToken,
            chat_id: !!chatId,
        },
        ai: {
            configured: !!(aiKey && aiModel),
            model: aiModel || 'gpt-4o',
            api_key: !!aiKey,
        },
        base_url: baseUrl,
    })
}
