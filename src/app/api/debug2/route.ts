import { NextResponse } from 'next/server'
import { generateText } from 'ai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { db } from '@/lib/db'
import { getDailyHealth, getHealthRange, healthToContext } from '@/lib/oura'
import { getDailyAnalysisPrompt } from '@/lib/prompts'

export const maxDuration = 300
export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const apiKey = await db.getEnv('AI_API_KEY')
        const googleUrl = 'https://generativelanguage.googleapis.com/v1alpha'
        const google = createGoogleGenerativeAI({ apiKey, baseURL: googleUrl })
        const model = google('gemini-3.1-pro-preview')

        const today = new Date().toISOString().split('T')[0]
        const health = await getDailyHealth(today)
        const history = await getHealthRange(7)

        const todayData = healthToContext(health)
        const trendData = history.map(h => healthToContext(h)).join('\n\n')
        const prompt = getDailyAnalysisPrompt('Chinese (Simplified)', todayData, trendData)

        const start = Date.now()
        const result = await generateText({
            model,
            system: 'You are a professional health analyst specializing in wearable data.',
            prompt,
            maxOutputTokens: 2000,
            temperature: 0.7,
            providerOptions: {
                google: {
                    safetySettings: [
                        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
                        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
                        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
                        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' }
                    ]
                }
            }
        })
        const ms = Date.now() - start

        return NextResponse.json({
            ok: true,
            ms,
            finishReason: result.finishReason,
            usage: result.usage,
            textLength: result.text.length,
            textEnding: result.text.slice(-100),
            warnings: result.warnings
        })
    } catch (e: any) {
        return NextResponse.json({ error: String(e), stack: e.stack }, { status: 500 })
    }
}
