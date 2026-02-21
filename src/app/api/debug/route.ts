import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
    try {
        const err = await db.getConfig('LAST_TG_ERROR')
        if (!err) return NextResponse.json({ last_error: null })
        try {
            return NextResponse.json({ last_error: JSON.parse(err) })
        } catch {
            return NextResponse.json({ last_error: err })
        }
    } catch (e: any) {
        return NextResponse.json({ error: e.message })
    }
}
