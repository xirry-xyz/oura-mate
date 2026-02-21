/**
 * Oura Mate — Telegram Bot utilities for webhook mode.
 * Reads bot token from DB first, falls back to env vars.
 */

import { db } from './db'

const TG_API = 'https://api.telegram.org/bot'

async function tgPost(method: string, body: Record<string, unknown>) {
    const token = await db.getEnv('TELEGRAM_BOT_TOKEN')
    if (!token) throw new Error('TELEGRAM_BOT_TOKEN not set')

    try {
        const res = await fetch(`${TG_API}${token}/${method}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        })
        const data = await res.json()
        if (!data.ok) {
            await db.setConfig('LAST_TG_ERROR', JSON.stringify({ method, body, error: data, time: new Date().toISOString() }))
        }
        return data
    } catch (err: any) {
        await db.setConfig('LAST_TG_ERROR', JSON.stringify({ method, error: err.message, time: new Date().toISOString() }))
        throw err
    }
}

export async function sendMessage(chatId: string, text: string, parseMode = 'HTML') {
    // Split long messages
    const MAX = 4000
    if (text.length <= MAX) {
        return tgPost('sendMessage', { chat_id: chatId, text, parse_mode: parseMode })
    }

    const chunks: string[] = []
    let remaining = text
    while (remaining.length > 0) {
        if (remaining.length <= MAX) {
            chunks.push(remaining)
            break
        }
        let splitAt = remaining.lastIndexOf('\n', MAX)
        if (splitAt < MAX / 2) splitAt = MAX
        chunks.push(remaining.slice(0, splitAt))
        remaining = remaining.slice(splitAt)
    }

    for (const chunk of chunks) {
        await tgPost('sendMessage', { chat_id: chatId, text: chunk, parse_mode: parseMode })
    }
}

export async function setWebhook(url: string) {
    return tgPost('setWebhook', { url, allowed_updates: ['message'] })
}

export async function deleteWebhook() {
    return tgPost('deleteWebhook', {})
}

export async function getWebhookInfo() {
    const token = await db.getEnv('TELEGRAM_BOT_TOKEN')
    if (!token) return { ok: false, result: { url: '' } }
    const res = await fetch(`${TG_API}${token}/getWebhookInfo`)
    return res.json()
}

export interface TelegramUpdate {
    message?: {
        chat: { id: number }
        text?: string
        from?: { first_name?: string; username?: string }
    }
}

export function parseCommand(text: string): { command: string; args: string } {
    const trimmed = text.trim()
    if (!trimmed.startsWith('/')) return { command: '', args: trimmed }
    const spaceIdx = trimmed.indexOf(' ')
    if (spaceIdx === -1) return { command: trimmed.split('@')[0].toLowerCase(), args: '' }
    const cmd = trimmed.slice(0, spaceIdx).split('@')[0].toLowerCase()
    return { command: cmd, args: trimmed.slice(spaceIdx + 1).trim() }
}
