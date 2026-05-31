import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService implements OnModuleInit {
  private readonly logger = new Logger(SupabaseService.name);
  private adminClient!: SupabaseClient;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    const url = this.config.getOrThrow<string>('SUPABASE_URL');
    const serviceKey = this.config.getOrThrow<string>('SUPABASE_SERVICE_ROLE_KEY');
    this.adminClient = createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    this.logger.log('Supabase admin client initialized');
  }

  /** Server-side client using the service role key. Bypasses RLS. */
  get admin(): SupabaseClient {
    return this.adminClient;
  }

  /** Create a per-request client scoped to a user's JWT (respects RLS). */
  forUser(accessToken: string): SupabaseClient {
    const url = this.config.getOrThrow<string>('SUPABASE_URL');
    const anonKey = this.config.getOrThrow<string>('SUPABASE_ANON_KEY');
    return createClient(url, anonKey, {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
}
