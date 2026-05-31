import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../../core/supabase/supabase.service';

export interface ProfileRow {
  id: string;
  username: string | null;
  avatar_url: string | null;
  current_streak: number;
  highest_streak: number;
  last_post_date: string | null;
}

/** Public, lightweight projection of a profile used for discovery/search. */
export interface ProfileSummary {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
}

const SUMMARY_FIELDS = 'id, username, display_name, avatar_url';

@Injectable()
export class ProfilesRepository {
  private readonly TABLE = 'profiles';

  constructor(private readonly supabase: SupabaseService) {}

  async findById(userId: string): Promise<ProfileRow> {
    const { data, error } = await this.supabase.admin
      .from(this.TABLE)
      .select('*')
      .eq('id', userId)
      .single();
    if (error || !data) throw new NotFoundException('Profile not found');
    return data as ProfileRow;
  }

  /**
   * Search profiles by username/display_name (case-insensitive, prefix-friendly),
   * excluding the requesting user. Returns a lightweight, public projection.
   */
  async search(query: string, excludeId: string, limit = 20): Promise<ProfileSummary[]> {
    const term = query.replace(/[%,]/g, '').trim();
    if (!term) return [];
    const { data, error } = await this.supabase.admin
      .from(this.TABLE)
      .select(SUMMARY_FIELDS)
      .neq('id', excludeId)
      .or(`username.ilike.%${term}%,display_name.ilike.%${term}%`)
      .limit(limit);
    if (error) throw error;
    return (data ?? []) as ProfileSummary[];
  }

  async updateStreakFields(
    userId: string,
    fields: Partial<Pick<ProfileRow, 'current_streak' | 'highest_streak' | 'last_post_date'>>,
  ): Promise<void> {
    const { error } = await this.supabase.admin
      .from(this.TABLE)
      .update(fields)
      .eq('id', userId);
    if (error) throw error;
  }
}
