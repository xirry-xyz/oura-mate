import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getOuraAuthUrl } from '@/lib/oura'

/**
 * GET /api/oura/auth — generate OAuth2 authorization URL.
 */
export async function GET(request: Request) {
    const clientId = await db.getEnv('OURA_CLIENT_ID')
    if (!clientId) return NextResponse.json({ error: 'OURA_CLIENT_ID not configured' }, { status: 400 })

    const host = request.headers.get("x-forwarded-host") || request.headers.get("host")
    const protocol = request.headers.get("x-forwarded-proto") || "https"
    const baseUrl = host ? `${protocol}://${host}` : (process.env.NEXT_PUBLIC_BASE_URL || `https://${process.env.VERCEL_URL}`)

    const redirectUri = `${baseUrl}/api/oura/callback`
    const state = Math.random().toString(36).slice(2)

    // Save state for CSRF check
    await db.setConfig('oura_oauth_state', state)

    const authUrl = getOuraAuthUrl(redirectUri, state, clientId)
    return NextResponse.json({ auth_url: authUrl })
}
