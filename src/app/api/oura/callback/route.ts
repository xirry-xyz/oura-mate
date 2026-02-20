import { NextRequest, NextResponse } from 'next/server'
import { exchangeOuraCode } from '@/lib/oura'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    const baseUrl = process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : process.env.NEXT_PUBLIC_BASE_URL || `http://localhost:${process.env.PORT || 3000}`

    if (error) {
        return NextResponse.redirect(`${baseUrl}/?error=oauth_denied`)
    }

    if (!code) {
        return NextResponse.redirect(`${baseUrl}/?error=missing_code`)
    }

    // Verify state
    const savedState = await db.getConfig('oauth_state')
    if (savedState && state !== savedState) {
        return NextResponse.redirect(`${baseUrl}/?error=invalid_state`)
    }

    try {
        const redirectUri = `${baseUrl}/api/oura/callback`
        await exchangeOuraCode(code, redirectUri)
        return NextResponse.redirect(`${baseUrl}/?success=oura_connected`)
    } catch (e) {
        console.error('OAuth exchange failed:', e)
        return NextResponse.redirect(`${baseUrl}/?error=token_exchange_failed`)
    }
}
