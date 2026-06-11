import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const ONESIGNAL_ENDPOINT = 'https://api.onesignal.com/notifications';

export interface PushMessage {
  title: string;
  body: string;
  /** Opened when the user taps the notification (absolute or app-relative URL). */
  url?: string;
  /** Arbitrary payload delivered to the client for in-app routing. */
  data?: Record<string, unknown>;
}

/**
 * Thin wrapper over the OneSignal REST API. Targets users by their Supabase
 * user id, which the web client registers as the OneSignal `external_id` via
 * `OneSignal.login(userId)` — so no per-device subscription table is needed.
 *
 * Sends are fire-and-forget: a delivery failure must never break the business
 * action that triggered it, so every error is swallowed and logged.
 */
@Injectable()
export class OneSignalService {
  private readonly logger = new Logger(OneSignalService.name);
  private readonly appId: string | undefined;
  private readonly apiKey: string | undefined;

  constructor(config: ConfigService) {
    this.appId = config.get<string>('ONESIGNAL_APP_ID');
    this.apiKey = config.get<string>('ONESIGNAL_REST_API_KEY');
    if (!this.appId || !this.apiKey) {
      this.logger.warn('ONESIGNAL_APP_ID / ONESIGNAL_REST_API_KEY not set — push notifications disabled');
    }
  }

  /** Push `message` to one or more users. Deduplicates and ignores empty ids. */
  async sendToUsers(userIds: string[], message: PushMessage): Promise<void> {
    if (!this.appId || !this.apiKey) return;

    const externalIds = [...new Set(userIds.filter(Boolean))];
    if (externalIds.length === 0) return;

    try {
      const res = await fetch(ONESIGNAL_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Key ${this.apiKey}`,
        },
        body: JSON.stringify({
          app_id: this.appId,
          target_channel: 'push',
          include_aliases: { external_id: externalIds },
          headings: { en: message.title },
          contents: { en: message.body },
          ...(message.url ? { url: message.url } : {}),
          ...(message.data ? { data: message.data } : {}),
        }),
      });

      if (!res.ok) {
        const detail = await res.text().catch(() => '');
        this.logger.warn(`OneSignal send failed (${res.status}): ${detail}`);
      }
    } catch (err) {
      this.logger.warn(`OneSignal send error: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
}
