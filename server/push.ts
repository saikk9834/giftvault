/**
 * Server-side Expo Push Notification helper.
 * Sends push notifications via the Expo Push API (https://exp.host/--/api/v2/push/send).
 * No credentials required — Expo push tokens are self-authenticating.
 */

export interface PushMessage {
  to: string | string[];
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: 'default' | null;
  badge?: number;
  channelId?: string;
}

interface ExpoPushTicket {
  status: 'ok' | 'error';
  id?: string;
  message?: string;
  details?: { error?: string };
}

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

/**
 * Send one or more push notifications via the Expo Push Service.
 * Silently swallows errors so a failed push never breaks the main flow.
 */
export async function sendExpoPush(messages: PushMessage | PushMessage[]): Promise<void> {
  const batch = Array.isArray(messages) ? messages : [messages];
  if (batch.length === 0) return;

  // Filter out non-Expo tokens (e.g. empty strings)
  const valid = batch.filter((m) => {
    const tokens = Array.isArray(m.to) ? m.to : [m.to];
    return tokens.some((t) => t && t.startsWith('ExponentPushToken['));
  });
  if (valid.length === 0) return;

  try {
    const res = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(valid),
    });

    if (!res.ok) {
      console.warn('[Push] Expo push API returned', res.status, await res.text());
      return;
    }

    const json = (await res.json()) as { data: ExpoPushTicket[] };
    for (const ticket of json.data ?? []) {
      if (ticket.status === 'error') {
        console.warn('[Push] Ticket error:', ticket.message, ticket.details);
      }
    }
  } catch (err) {
    console.warn('[Push] Failed to send push notification:', err);
  }
}
