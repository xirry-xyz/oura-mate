/**
 * Oura Mate — Telegram Bot utilities for webhook mode.
 */

const TG_API = (method: string) =>
    `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/${method}`

export async function sendMessage(
    chatId: string,
    text: string,
    parseMode: string = 'Markdown'
): Promise<void> {
    // Telegram has a 4096 char limit
    const chunks = splitMessage(text, 4000)

    for (const chunk of chunks) {
        try {
            await fetch(TG_API('sendMessage'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: chatId,
                    text: chunk,
                    parse_mode: parseMode,
                }),
            })
        } catch {
            // Retry without parse_mode if markdown fails
            await fetch(TG_API('sendMessage'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: chatId,
                    text: chunk,
                }),
            })
        }
    }
}

export async function setWebhook(webhookUrl: string): Promise<boolean> {
    const res = await fetch(TG_API('setWebhook'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            url: webhookUrl,
            allowed_updates: ['message'],
        }),
    })
    const data = await res.json()
    return data.ok === true
}

export async function deleteWebhook(): Promise<boolean> {
    const res = await fetch(TG_API('deleteWebhook'), { method: 'POST' })
    const data = await res.json()
    return data.ok === true
}

export async function getWebhookInfo(): Promise<{ url: string; pending_update_count: number }> {
    const res = await fetch(TG_API('getWebhookInfo'))
    const data = await res.json()
    return data.result
}

function splitMessage(text: string, maxLen: number): string[] {
    if (text.length <= maxLen) return [text]

    const chunks: string[] = []
    let current = ''

    for (const line of text.split('\n')) {
        if (current.length + line.length + 1 > maxLen) {
            chunks.push(current)
            current = line
        } else {
            current += (current ? '\n' : '') + line
        }
    }
    if (current) chunks.push(current)

    return chunks
}

// --- Telegram update types ---

export interface TelegramUpdate {
    update_id: number
    message?: {
        message_id: number
        from?: { id: number; first_name: string; username?: string }
        chat: { id: number; type: string }
        date: number
        text?: string
        entities?: { type: string; offset: number; length: number }[]
    }
}

export function parseCommand(update: TelegramUpdate): { command: string; args: string } | null {
    const text = update.message?.text
    if (!text || !text.startsWith('/')) return null

    const parts = text.split(' ')
    const command = parts[0].replace(/@\w+/, '').toLowerCase() // remove @botname
    const args = parts.slice(1).join(' ')

    return { command, args }
}
