import { NextRequest, NextResponse } from 'next/server'
import { db, CONFIG_KEYS, type ConfigKey } from '@/lib/db'

/**
 * GET /api/config — return all config values (masked).
 */
export async function GET() {
    const config = await db.getAllConfig()
    return NextResponse.json(config)
}

/**
 * POST /api/config — save config values.
 */
export async function POST(request: NextRequest) {
    const body = await request.json()

    // Validate keys
    const validConfig: Partial<Record<ConfigKey, string>> = {}
    for (const key of CONFIG_KEYS) {
        if (body[key] !== undefined && typeof body[key] === 'string') {
            validConfig[key] = body[key]
        }
    }

    await db.saveAllConfig(validConfig)

    return NextResponse.json({ ok: true, saved: Object.keys(validConfig) })
}
