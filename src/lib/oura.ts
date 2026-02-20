/**
 * Oura Mate — Oura API v2 client with OAuth2 + auto token refresh.
 * Reads config from DB first, falls back to env vars.
 */

import { db } from './db'

const OURA_AUTH_URL = 'https://cloud.ouraring.com/oauth/authorize'
const OURA_TOKEN_URL = 'https://api.ouraring.com/oauth/token'
const OURA_API_BASE = 'https://api.ouraring.com'
const OURA_SCOPES = 'daily email personal session heartrate workout spo2'

export function getOuraAuthUrl(redirectUri: string, state: string, clientId: string): string {
    const params = new URLSearchParams({
        client_id: clientId,
        response_type: 'code',
        redirect_uri: redirectUri,
        scope: OURA_SCOPES,
        state,
    })
    return `${OURA_AUTH_URL}?${params.toString()}`
}

export async function exchangeOuraCode(code: string, redirectUri: string) {
    const clientId = await db.getEnv('OURA_CLIENT_ID')
    const clientSecret = await db.getEnv('OURA_CLIENT_SECRET')

    const res = await fetch(OURA_TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            grant_type: 'authorization_code',
            code,
            redirect_uri: redirectUri,
            client_id: clientId,
            client_secret: clientSecret,
        }),
    })

    if (!res.ok) {
        const err = await res.text()
        throw new Error(`Token exchange failed: ${err}`)
    }

    const data = await res.json()
    const expiresAt = new Date(Date.now() + (data.expires_in || 86400) * 1000).toISOString()

    await db.saveTokens(data.access_token, data.refresh_token, expiresAt)
    return data
}

async function refreshToken(): Promise<string> {
    const tokens = await db.getTokens()
    if (!tokens?.refreshToken) throw new Error('No refresh token. Please re-authorize.')

    const clientId = await db.getEnv('OURA_CLIENT_ID')
    const clientSecret = await db.getEnv('OURA_CLIENT_SECRET')

    const res = await fetch(OURA_TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: tokens.refreshToken,
            client_id: clientId,
            client_secret: clientSecret,
        }),
    })

    if (!res.ok) throw new Error('Token refresh failed')

    const data = await res.json()
    const expiresAt = new Date(Date.now() + (data.expires_in || 86400) * 1000).toISOString()
    await db.saveTokens(data.access_token, data.refresh_token, expiresAt)
    return data.access_token
}

async function getAccessToken(): Promise<string> {
    const tokens = await db.getTokens()
    if (!tokens) throw new Error('Not authorized. Connect Oura first.')

    if (tokens.expiresAt) {
        const exp = new Date(tokens.expiresAt).getTime()
        if (Date.now() > exp - 5 * 60 * 1000) {
            return refreshToken()
        }
    }

    return tokens.accessToken
}

async function ouraGet(endpoint: string, params?: Record<string, string>) {
    let token = await getAccessToken()
    const url = new URL(`${OURA_API_BASE}${endpoint}`)
    if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))

    let res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` },
    })

    if (res.status === 401) {
        token = await refreshToken()
        res = await fetch(url.toString(), {
            headers: { Authorization: `Bearer ${token}` },
        })
    }

    if (!res.ok) throw new Error(`Oura API error: ${res.status}`)
    return res.json()
}

// --- Data types ---

export interface SleepData {
    day: string
    score?: number
    totalSleep?: number
    deepSleep?: number
    remSleep?: number
    lightSleep?: number
    awakeTime?: number
    avgHR?: number
    lowestHR?: number
    avgHRV?: number
    efficiency?: number
    restfulness?: number
    latency?: number
}

export interface ActivityData {
    day: string
    score?: number
    activeCalories?: number
    totalCalories?: number
    steps?: number
    distance?: number
    highActivity?: number
    mediumActivity?: number
    lowActivity?: number
    sedentaryTime?: number
}

export interface ReadinessData {
    day: string
    score?: number
    tempDeviation?: number
    activityBalance?: number
    bodyTemperature?: number
    hrvBalance?: number
    previousDayActivity?: number
    previousNight?: number
    recoveryIndex?: number
    restingHeartRate?: number
    sleepBalance?: number
}

export interface DailyHealth {
    day: string
    sleep?: SleepData
    activity?: ActivityData
    readiness?: ReadinessData
}

// --- Data fetching ---

export async function getDailyHealth(targetDate: string): Promise<DailyHealth> {
    const [sleepDaily, sleepDetail, activity, readiness] = await Promise.all([
        ouraGet('/v2/usercollection/daily_sleep', { start_date: targetDate, end_date: targetDate }),
        ouraGet('/v2/usercollection/sleep', { start_date: targetDate, end_date: targetDate }),
        ouraGet('/v2/usercollection/daily_activity', { start_date: targetDate, end_date: targetDate }),
        ouraGet('/v2/usercollection/daily_readiness', { start_date: targetDate, end_date: targetDate }),
    ])

    const health: DailyHealth = { day: targetDate }

    const sd = sleepDaily.data?.[0]
    const detail = sleepDetail.data?.at(-1)
    if (sd) {
        const contributors = sd.contributors || {}
        health.sleep = {
            day: targetDate, score: sd.score, efficiency: contributors.efficiency,
            restfulness: contributors.restfulness, latency: contributors.latency,
            totalSleep: detail?.total_sleep_duration, deepSleep: detail?.deep_sleep_duration,
            remSleep: detail?.rem_sleep_duration, lightSleep: detail?.light_sleep_duration,
            awakeTime: detail?.awake_time, avgHR: detail?.average_heart_rate,
            lowestHR: detail?.lowest_heart_rate, avgHRV: detail?.average_hrv,
        }
    }

    const ad = activity.data?.[0]
    if (ad) {
        health.activity = {
            day: targetDate, score: ad.score, activeCalories: ad.active_calories,
            totalCalories: ad.total_calories, steps: ad.steps,
            distance: ad.equivalent_walking_distance, highActivity: ad.high_activity_time,
            mediumActivity: ad.medium_activity_time, lowActivity: ad.low_activity_time,
            sedentaryTime: ad.sedentary_time,
        }
    }

    const rd = readiness.data?.[0]
    if (rd) {
        const c = rd.contributors || {}
        health.readiness = {
            day: targetDate, score: rd.score, tempDeviation: rd.temperature_deviation,
            activityBalance: c.activity_balance, bodyTemperature: c.body_temperature,
            hrvBalance: c.hrv_balance, previousDayActivity: c.previous_day_activity,
            previousNight: c.previous_night, recoveryIndex: c.recovery_index,
            restingHeartRate: c.resting_heart_rate, sleepBalance: c.sleep_balance,
        }
    }

    return health
}

export async function getHealthRange(days: number = 7): Promise<DailyHealth[]> {
    const results: DailyHealth[] = []
    const today = new Date()
    for (let i = days - 1; i >= 0; i--) {
        const d = new Date(today)
        d.setDate(d.getDate() - i)
        const dateStr = d.toISOString().split('T')[0]
        try { results.push(await getDailyHealth(dateStr)) }
        catch (e) { console.warn(`Failed to fetch ${dateStr}:`, e) }
    }
    return results
}

export async function isAuthorized(): Promise<boolean> {
    const tokens = await db.getTokens()
    return !!tokens?.accessToken
}

// --- Formatting ---

function fmtDuration(seconds?: number): string {
    if (!seconds) return '-'
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    return `${h}h${m}m`
}

export function healthToContext(h: DailyHealth): string {
    const lines = [`📅 Date: ${h.day}`]
    if (h.sleep) {
        const s = h.sleep
        lines.push(`💤 Sleep: Score ${s.score ?? '-'} | Total ${fmtDuration(s.totalSleep)} | Deep ${fmtDuration(s.deepSleep)} | REM ${fmtDuration(s.remSleep)} | HRV ${s.avgHRV ?? '-'}ms | HR ${s.avgHR ?? '-'}bpm (low ${s.lowestHR ?? '-'})`)
    }
    if (h.activity) {
        const a = h.activity
        lines.push(`🏃 Activity: Score ${a.score ?? '-'} | Steps ${a.steps?.toLocaleString() ?? '-'} | Active Cal ${a.activeCalories ?? '-'} | High ${fmtDuration(a.highActivity)} | Med ${fmtDuration(a.mediumActivity)}`)
    }
    if (h.readiness) {
        const r = h.readiness
        lines.push(`⚡ Readiness: Score ${r.score ?? '-'} | HRV Balance ${r.hrvBalance ?? '-'} | RHR ${r.restingHeartRate ?? '-'} | Temp ${r.tempDeviation ? (r.tempDeviation > 0 ? '+' : '') + r.tempDeviation.toFixed(1) + '°' : '-'} | Recovery ${r.recoveryIndex ?? '-'}`)
    }
    return lines.join('\n')
}

export function healthToSummary(h: DailyHealth): string {
    const parts: string[] = []
    if (h.sleep) {
        parts.push(`💤 *Sleep Score:* ${h.sleep.score ?? '-'}  |  Total: ${fmtDuration(h.sleep.totalSleep)}`)
        parts.push(`   Deep: ${fmtDuration(h.sleep.deepSleep)}  |  REM: ${fmtDuration(h.sleep.remSleep)}  |  Light: ${fmtDuration(h.sleep.lightSleep)}`)
        if (h.sleep.avgHRV) parts.push(`   HRV: ${h.sleep.avgHRV}ms  |  HR: ${h.sleep.avgHR ?? '-'}bpm  |  Lowest HR: ${h.sleep.lowestHR ?? '-'}bpm`)
    }
    if (h.activity) {
        parts.push(`🏃 *Activity Score:* ${h.activity.score ?? '-'}  |  Steps: ${h.activity.steps?.toLocaleString() ?? '-'}`)
        parts.push(`   Active Cal: ${h.activity.activeCalories ?? '-'}  |  Total Cal: ${h.activity.totalCalories ?? '-'}`)
    }
    if (h.readiness) parts.push(`⚡ *Readiness Score:* ${h.readiness.score ?? '-'}`)
    return parts.join('\n')
}
