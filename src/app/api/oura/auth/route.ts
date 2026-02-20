import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getOuraAuthUrl } from '@/lib/oura'

/**
 * GET /api/oura/auth — generate OAuth2 authorization URL.
 */
export async function GET() {
    const clientId = await db.getEnv('OURA_CLIENT_ID')
    if (!clientId) return NextResponse.json({ error: 'OURA_CLIENT_ID not configured' }, { status: 400 })

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL
        || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')

    const redirectUri = `${baseUrl}/api/oura/callback`
    const state = Math.random().toString(36).slice(2)

    // Save state for CSRF check
    await db.setConfig('oura_oauth_state', state)

    const authUrl = getOuraAuthUrl(redirectUri, state, clientId)
    return NextResponse.json({ auth_url: authUrl })
}
