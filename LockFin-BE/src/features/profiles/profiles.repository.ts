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
