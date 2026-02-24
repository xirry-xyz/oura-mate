/**
 * Oura Mate — AI analysis using Vercel AI SDK for multi-provider support.
 * Reads config from DB first, falls back to env vars.
 */

import { generateText } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { createAnthropic } from '@ai-sdk/anthropic'
import { getDailyAnalysisPrompt } from './prompts'
import { db } from './db'
import type { DailyHealth } from './oura'
import { healthToContext } from './oura'

const LANG_MAP: Record<string, string> = {
    zh: 'Chinese (Simplified)', en: 'English', ja: 'Japanese',
    ko: 'Korean', es: 'Spanish', fr: 'French', de: 'German',
}

async function getModel() {
    const modelName = await db.getEnv('AI_MODEL') || 'gpt-4o'
    const apiKey = await db.getEnv('AI_API_KEY')
    const baseUrl = await db.getEnv('AI_BASE_URL') || undefined

    // Gemini models
    if (modelName.startsWith('gemini')) {
        // Automatically route next-gen Gemini models to v1alpha endpoint
        const isNextGen = modelName.includes('gemini-3') || modelName.includes('gemini-2.5')
        const googleUrl = isNextGen
            ? 'https://generativelanguage.googleapis.com/v1alpha'
            : 'https://generativelanguage.googleapis.com/v1beta'

        const google = createGoogleGenerativeAI({ apiKey, baseURL: googleUrl })
        return google(modelName)
    }

    // Claude models
    if (modelName.startsWith('claude')) {
        const anthropic = createAnthropic({ apiKey })
        return anthropic(modelName)
    }

    // Default: OpenAI-compatible
    const openai = createOpenAI({ apiKey, baseURL: baseUrl })
    return openai(modelName)
}

function computeAverages(history: DailyHealth[]): string {
    const sleepScores: number[] = [], activityScores: number[] = [], readinessScores: number[] = []
    const stepsList: number[] = [], hrvList: number[] = [], rhrList: number[] = []

    for (const h of history) {
        if (h.sleep?.score != null) sleepScores.push(h.sleep.score)
        if (h.sleep?.avgHRV != null) hrvList.push(h.sleep.avgHRV)
        if (h.activity?.score != null) activityScores.push(h.activity.score)
        if (h.activity?.steps != null) stepsList.push(h.activity.steps)
        if (h.readiness?.score != null) readinessScores.push(h.readiness.score)
        if (h.readiness?.restingHeartRate != null) rhrList.push(h.readiness.restingHeartRate)
    }

    const avg = (arr: number[]) => arr.length ? (arr.reduce((a, b) => a + b, 0) / arr.length) : null
    const parts: string[] = []
    const sa = avg(sleepScores); if (sa) parts.push(`Avg Sleep Score: ${sa.toFixed(0)}`)
    const aa = avg(activityScores); if (aa) parts.push(`Avg Activity Score: ${aa.toFixed(0)}`)
    const ra = avg(readinessScores); if (ra) parts.push(`Avg Readiness Score: ${ra.toFixed(0)}`)
    const st = avg(stepsList); if (st) parts.push(`Avg Steps: ${st.toLocaleString(undefined, { maximumFractionDigits: 0 })}`)
    const hv = avg(hrvList); if (hv) parts.push(`Avg HRV: ${hv.toFixed(0)}ms`)
    const rh = avg(rhrList); if (rh) parts.push(`Avg Resting HR: ${rh.toFixed(0)}bpm`)
    return parts.length ? parts.join('\n') : 'Insufficient data for averages.'
}

export async function analyzeDaily(today: DailyHealth, history?: DailyHealth[]): Promise<string> {
    const todayData = healthToContext(today)
    let trendData = 'No historical data available.'
    if (history && history.length > 1) {
        trendData = history.map(h => healthToContext(h)).join('\n\n') + '\n\n--- 7-Day Averages ---\n' + computeAverages(history)
    }

    const langCode = await db.getEnv('ANALYSIS_LANGUAGE') || 'zh'
    const language = LANG_MAP[langCode] || langCode
    const prompt = getDailyAnalysisPrompt(language, todayData, trendData)

    try {
        const model = await getModel()
        const { text } = await generateText({
            model,
            system: 'You are a professional health analyst specializing in wearable data.',
            prompt,
            maxOutputTokens: 8192,
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
        const modelName = await db.getEnv('AI_MODEL') || 'gpt-4o'
        await db.saveAnalysis(today.day, text, modelName)
        return text
    } catch (e) {
        console.error('AI analysis failed:', e)
        return `⚠️ AI analysis failed: ${e}\n\nRaw data:\n${todayData}`
    }
}

export async function askQuestion(question: string, today: DailyHealth, history?: DailyHealth[]): Promise<string> {
    let context = `Today's health data:\n${healthToContext(today)}`
    if (history) context += '\n\nRecent history:\n' + history.slice(-7).map(h => healthToContext(h)).join('\n')

    const langCode = await db.getEnv('ANALYSIS_LANGUAGE') || 'zh'
    const language = LANG_MAP[langCode] || langCode

    try {
        const model = await getModel()
        const { text } = await generateText({
            model,
            system: `You are a health analyst with access to the user's Oura Ring data. Answer their questions based on the data provided. Respond in ${language}. Be specific and use numbers. Format your response using basic HTML tags (<b>, <i>, <code>, <pre>) NEVER use markdown asterisks.`,
            prompt: `My health data:\n${context}\n\nQuestion: ${question}`,
            maxOutputTokens: 8192,
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
        return text
    } catch (e: any) {
        console.error('AI question failed:', e)
        const safeError = e.message ? String(e.message).replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&') : 'Unknown'
        return `⚠️ AI response failed: ${safeError}`
    }
}
