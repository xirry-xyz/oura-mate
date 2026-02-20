import { NextResponse } from 'next/server'
import { getOuraAuthUrl } from '@/lib/oura'
import { db } from '@/lib/db'

export async function GET() {
    if (!process.env.OURA_CLIENT_ID || !process.env.OURA_CLIENT_SECRET) {
        return NextResponse.json({ error: 'Oura Client ID/Secret not configured' }, { status: 400 })
    }

    const baseUrl = process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : process.env.NEXT_PUBLIC_BASE_URL || `http://localhost:${process.env.PORT || 3000}`

    const redirectUri = `${baseUrl}/api/oura/callback`

    // Generate CSRF state token
    const state = crypto.randomUUID()
    await db.setConfig('oauth_state', state)

    const authUrl = getOuraAuthUrl(redirectUri, state)

    return NextResponse.json({ auth_url: authUrl })
}
