/**
 * Oura Mate — AI analysis using Vercel AI SDK for multi-provider support.
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
    zh: 'Chinese (Simplified)',
    en: 'English',
    ja: 'Japanese',
    ko: 'Korean',
    es: 'Spanish',
    fr: 'French',
    de: 'German',
}

function getModel() {
    const modelName = process.env.AI_MODEL || 'gpt-4o'
    const apiKey = process.env.AI_API_KEY || ''
    const baseUrl = process.env.AI_BASE_URL || undefined

    // Detect provider from model name
    if (modelName.startsWith('gemini/') || modelName.startsWith('models/')) {
        const name = modelName.replace('gemini/', '')
        const google = createGoogleGenerativeAI({ apiKey })
        return google(name)
    }

    if (modelName.startsWith('claude-') || modelName.startsWith('anthropic/')) {
        const name = modelName.replace('anthropic/', '')
        const anthropic = createAnthropic({ apiKey })
        return anthropic(name)
    }

    // Default: OpenAI-compatible (also works for Ollama, Azure, etc.)
    const openai = createOpenAI({ apiKey, baseURL: baseUrl })
    return openai(modelName)
}

function computeAverages(history: DailyHealth[]): string {
    const sleepScores: number[] = []
    const activityScores: number[] = []
    const readinessScores: number[] = []
    const stepsList: number[] = []
    const hrvList: number[] = []
    const rhrList: number[] = []

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

export async function analyzeDaily(
    today: DailyHealth,
    history?: DailyHealth[]
): Promise<string> {
    const todayData = healthToContext(today)

    let trendData = 'No historical data available.'
    if (history && history.length > 1) {
        const trendLines = history.map(h => healthToContext(h))
        trendData = trendLines.join('\n\n') + '\n\n--- 7-Day Averages ---\n' + computeAverages(history)
    }

    const language = LANG_MAP[process.env.ANALYSIS_LANGUAGE || 'zh'] || process.env.ANALYSIS_LANGUAGE || 'Chinese'
    const prompt = getDailyAnalysisPrompt(language, todayData, trendData)

    try {
        const { text } = await generateText({
            model: getModel(),
            system: 'You are a professional health analyst specializing in wearable data.',
            prompt,
            maxOutputTokens: 2000,
            temperature: 0.7,
        })
        await db.saveAnalysis(today.day, text, process.env.AI_MODEL || 'gpt-4o')
        return text
    } catch (e) {
        console.error('AI analysis failed:', e)
        return `⚠️ AI analysis failed: ${e}\n\nRaw data:\n${todayData}`
    }
}

export async function askQuestion(
    question: string,
    today: DailyHealth,
    history?: DailyHealth[]
): Promise<string> {
    let context = `Today's health data:\n${healthToContext(today)}`
    if (history) {
        context += '\n\nRecent history:\n' + history.slice(-7).map(h => healthToContext(h)).join('\n')
    }

    const language = LANG_MAP[process.env.ANALYSIS_LANGUAGE || 'zh'] || 'Chinese'

    try {
        const { text } = await generateText({
            model: getModel(),
            system: `You are a health analyst with access to the user's Oura Ring data. Answer their questions based on the data provided. Respond in ${language}. Be specific and use numbers.`,
            prompt: `My health data:\n${context}\n\nQuestion: ${question}`,
            maxOutputTokens: 1500,
            temperature: 0.7,
        })
        return text
    } catch (e) {
        console.error('AI question failed:', e)
        return `⚠️ AI response failed: ${e}`
    }
}
