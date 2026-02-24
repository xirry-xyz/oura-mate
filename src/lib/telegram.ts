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

function escapeTelegramHTML(text: string): string {
    const validTags: string[] = []
    const withPlaceholders = text.replace(/<\/?(?:b|i|code|pre)>/gi, (match) => {
        validTags.push(match)
        return `@@@TG_TAG_${validTags.length - 1}@@@`
    })

    const escaped = withPlaceholders
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')

    let finalHtml = escaped.replace(/@@@TG_TAG_(\d+)@@@/g, (_, index) => validTags[parseInt(index)])

    // Auto-close any unclosed HTML tags to prevent Telegram parser crashes
    const stack: string[] = []
    const tagRegex = /<\/?(b|i|code|pre)>/gi
    let match
    while ((match = tagRegex.exec(finalHtml)) !== null) {
        const isClosing = match[0].startsWith('</')
        const tag = match[1].toLowerCase()
        if (isClosing) {
            if (stack.length > 0 && stack[stack.length - 1] === tag) stack.pop()
        } else {
            stack.push(tag)
        }
    }
    while (stack.length > 0) {
        finalHtml += `</${stack.pop()}>`
    }

    return finalHtml
}

export async function sendMessage(chatId: string, text: string, parseMode = 'HTML') {
    // Split long messages BEFORE HTML escaping to prevent cutting open tags in half
    const MAX = 3500 // Safer limit allowing room for HTML expansion
    const chunks: string[] = []

    if (text.length <= MAX) {
        chunks.push(text)
    } else {
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
    }

    for (const chunk of chunks) {
        const safeChunk = parseMode === 'HTML' ? escapeTelegramHTML(chunk) : chunk
        await tgPost('sendMessage', { chat_id: chatId, text: safeChunk, parse_mode: parseMode })
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
