import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
    try {
        const err = await db.getConfig('LAST_TG_ERROR')
        return NextResponse.json({ last_error: err ? JSON.parse(err) : null })
    } catch {
        return NextResponse.json({ last_error: 'Failed to parse error log' })
    }
}
