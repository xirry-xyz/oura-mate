/**
 * Oura Mate — Upstash Redis storage for tokens, config, and data cache.
 * Falls back to in-memory if Redis is not configured.
 */

import { Redis } from '@upstash/redis'

interface OAuthTokens {
    accessToken: string
    refreshToken: string
    expiresAt: string
}

// Keys
const KEY_TOKENS = 'oura:tokens'
const KEY_CONFIG = (k: string) => `oura:config:${k}`
const KEY_DAILY = (d: string) => `oura:daily:${d}`
const KEY_ANALYSIS = (d: string) => `oura:analysis:${d}`

/** All user-configurable keys */
export const CONFIG_KEYS = [
    'TELEGRAM_BOT_TOKEN',
    'TELEGRAM_CHAT_ID',
    'AI_API_KEY',
    'AI_MODEL',
    'AI_BASE_URL',
    'OURA_CLIENT_ID',
    'OURA_CLIENT_SECRET',
    'ANALYSIS_LANGUAGE',
    'CRON_SCHEDULE_TIME',
    'CRON_TIMEZONE',
] as const

export type ConfigKey = (typeof CONFIG_KEYS)[number]

class Database {
    private redis: Redis | null = null
    private memory: Map<string, string> = new Map()
    private initialized = false

    private init() {
        if (this.initialized) return
        this.initialized = true

        if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
            this.redis = new Redis({
                url: process.env.KV_REST_API_URL,
                token: process.env.KV_REST_API_TOKEN,
            })
        }
    }

    private async get(key: string): Promise<string | null> {
        this.init()
        if (this.redis) {
            return this.redis.get<string>(key)
        }
        return this.memory.get(key) ?? null
    }

    private async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
        this.init()
        if (this.redis) {
            if (ttlSeconds) {
                await this.redis.set(key, value, { ex: ttlSeconds })
            } else {
                await this.redis.set(key, value)
            }
        } else {
            this.memory.set(key, value)
        }
    }

    // --- Config (DB-first, env fallback) ---

    /**
     * Get a config value. Checks DB first, then env vars.
     */
    async getEnv(key: ConfigKey): Promise<string> {
        const dbVal = await this.get(KEY_CONFIG(key))
        if (dbVal !== null && dbVal !== undefined) return String(dbVal)
        return process.env[key] || ''
    }

    async setConfig(key: string, value: string) {
        await this.set(KEY_CONFIG(key), value)
    }

    async getConfig(key: string): Promise<string | null> {
        return this.get(KEY_CONFIG(key))
    }

    /**
     * Get all user-configurable values (masked for frontend display).
     */
    async getAllConfig(): Promise<Record<string, { set: boolean; masked: string }>> {
        const result: Record<string, { set: boolean; masked: string }> = {}
        for (const key of CONFIG_KEYS) {
            const val = await this.getEnv(key)
            result[key] = {
                set: !!val,
                masked: val ? maskValue(key, val) : '',
            }
        }
        return result
    }

    /**
     * Save multiple config values at once.
     */
    async saveAllConfig(config: Partial<Record<ConfigKey, string>>) {
        for (const [key, value] of Object.entries(config)) {
            if (value !== undefined && value !== '') {
                await this.setConfig(key, value)
            }
        }
    }

    // --- Internal Auth ---

    async getPassword(): Promise<string | null> {
        return this.get('oura:internal:password')
    }

    async setPassword(password: string) {
        await this.set('oura:internal:password', password)
    }

    // --- Tokens ---

    async saveTokens(accessToken: string, refreshToken: string, expiresAt: string) {
        const tokens: OAuthTokens = { accessToken, refreshToken, expiresAt }
        await this.set(KEY_TOKENS, JSON.stringify(tokens))
    }

    async getTokens(): Promise<OAuthTokens | null> {
        const raw = await this.get(KEY_TOKENS)
        if (!raw) return null
        try {
            return typeof raw === 'string' ? JSON.parse(raw) : raw as unknown as OAuthTokens
        } catch {
            return null
        }
    }

    // --- Daily data cache ---

    async saveDailyData(date: string, data: unknown) {
        await this.set(KEY_DAILY(date), JSON.stringify(data), 86400)
    }

    async getDailyData(date: string): Promise<unknown | null> {
        const raw = await this.get(KEY_DAILY(date))
        if (!raw) return null
        try {
            return typeof raw === 'string' ? JSON.parse(raw) : raw
        } catch {
            return null
        }
    }

    // --- Analysis history ---

    async saveAnalysis(date: string, analysis: string, model: string) {
        await this.set(KEY_ANALYSIS(date), JSON.stringify({ analysis, model, timestamp: new Date().toISOString() }))
    }

    async getAnalysis(date: string): Promise<{ analysis: string; model: string } | null> {
        const raw = await this.get(KEY_ANALYSIS(date))
        if (!raw) return null
        try {
            return typeof raw === 'string' ? JSON.parse(raw) : raw as { analysis: string; model: string }
        } catch {
            return null
        }
    }
}

/** Mask sensitive values for display */
function maskValue(key: string, value: string): string {
    if (key === 'AI_MODEL' || key === 'ANALYSIS_LANGUAGE' || key === 'CRON_SCHEDULE_TIME' || key === 'CRON_TIMEZONE') return value
    return '••••已配置'
}

export const db = new Database()
