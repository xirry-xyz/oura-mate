import { NextRequest, NextResponse } from 'next/server'
import { db, CONFIG_KEYS, type ConfigKey } from '@/lib/db'

/**
 * GET /api/config — return all config values (masked).
 * Requires authorization header to match db password.
 * Returns { needsPassword: true } if no password is set yet.
 */
export async function GET(request: NextRequest) {
    const pwd = await db.getPassword()
    if (!pwd) {
        return NextResponse.json({ needsPassword: true })
    }

    const auth = request.headers.get('authorization')?.replace('Bearer ', '')
    if (auth !== pwd) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const config = await db.getAllConfig()
    return NextResponse.json(config)
}

/**
 * POST /api/config — save config values.
 */
export async function POST(request: NextRequest) {
    const pwd = await db.getPassword()
    const auth = request.headers.get('authorization')?.replace('Bearer ', '')
    const body = await request.json()

    // 1. Password check or creation
    if (!pwd) {
        if (!body.password) {
            return NextResponse.json({ error: 'Password required for first-time setup' }, { status: 400 })
        }
        await db.setPassword(body.password)
    } else {
        if (auth !== pwd) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
    }

    // 2. Only allow changing password if authenticated
    if (body.password && pwd && auth === pwd) {
        await db.setPassword(body.password)
    }

    // 3. Validate and save keys
    const validConfig: Partial<Record<ConfigKey, string>> = {}
    for (const key of CONFIG_KEYS) {
        if (body[key] !== undefined && typeof body[key] === 'string' && body[key] !== '') {
            validConfig[key] = body[key]
        }
    }

    await db.saveAllConfig(validConfig)

    return NextResponse.json({ ok: true, saved: Object.keys(validConfig) })
}
