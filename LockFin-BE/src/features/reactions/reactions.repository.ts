import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../../core/supabase/supabase.service';

export interface ReactionRawRow {
  post_id: string;
  user_id: string;
  emoji: string;
}

@Injectable()
export class ReactionsRepository {
  private readonly TABLE = 'post_reactions';

  constructor(private readonly supabase: SupabaseService) {}

  /** The author of a post, or null if the post doesn't exist. */
  async postAuthor(postId: string): Promise<string | null> {
    const { data, error } = await this.supabase.admin
      .from('posts')
      .select('user_id')
      .eq('id', postId)
      .maybeSingle();
    if (error) throw error;
    return (data as { user_id: string } | null)?.user_id ?? null;
  }

  /** Whether the given (post, user, emoji) reaction already exists. */
  async exists(postId: string, userId: string, emoji: string): Promise<boolean> {
    const { data, error } = await this.supabase.admin
      .from(this.TABLE)
      .select('post_id')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .eq('emoji', emoji)
      .maybeSingle();
    if (error) throw error;
    return !!data;
  }

  async add(postId: string, userId: string, emoji: string): Promise<void> {
    const { error } = await this.supabase.admin
      .from(this.TABLE)
      .upsert(
        { post_id: postId, user_id: userId, emoji },
        { onConflict: 'post_id,user_id,emoji', ignoreDuplicates: true },
      );
    if (error) throw error;
  }

  async remove(postId: string, userId: string, emoji: string): Promise<void> {
    const { error } = await this.supabase.admin
      .from(this.TABLE)
      .delete()
      .eq('post_id', postId)
      .eq('user_id', userId)
      .eq('emoji', emoji);
    if (error) throw error;
  }

  /** All reaction rows for a set of posts (post_id, user_id, emoji). */
  async rawForPosts(postIds: string[]): Promise<ReactionRawRow[]> {
    if (postIds.length === 0) return [];
    const { data, error } = await this.supabase.admin
      .from(this.TABLE)
      .select('post_id, user_id, emoji')
      .in('post_id', postIds);
    if (error) throw error;
    return (data ?? []) as ReactionRawRow[];
  }
}
