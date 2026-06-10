import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../../core/supabase/supabase.service';
import type { PostRow } from '../posts/posts.repository';

export interface AlbumRow {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  cover_photo_url: string | null;
  is_public: boolean;
  budget_amount: number | null;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
}

/** Aggregated numbers for one album (post count, dynamic spend/income, fallback cover). */
export interface AlbumStat {
  album_id: string;
  post_count: number;
  spent: number;   // sum of EXPENSE posts
  income: number;  // sum of INCOME posts
  latest_cover: string | null;
}

/** Columns the BE writes on create/update (no id/user_id/timestamps). */
export type AlbumWritable = Partial<
  Pick<
    AlbumRow,
    | 'name'
    | 'description'
    | 'cover_photo_url'
    | 'is_public'
    | 'budget_amount'
    | 'start_date'
    | 'end_date'
  >
>;

@Injectable()
export class AlbumsRepository {
  private readonly TABLE = 'albums';

  constructor(private readonly supabase: SupabaseService) {}

  async create(userId: string, input: AlbumWritable): Promise<AlbumRow> {
    const { data, error } = await this.supabase.admin
      .from(this.TABLE)
      .insert({ user_id: userId, ...input })
      .select('*')
      .single();
    if (error) throw error;
    return data as AlbumRow;
  }

  /** Album by id scoped to its owner. */
  async findOne(userId: string, id: string): Promise<AlbumRow | null> {
    const { data, error } = await this.supabase.admin
      .from(this.TABLE)
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .maybeSingle();
    if (error) throw error;
    return (data as AlbumRow) ?? null;
  }

  /** Album by id regardless of owner — caller enforces visibility. */
  async findById(id: string): Promise<AlbumRow | null> {
    const { data, error } = await this.supabase.admin
      .from(this.TABLE)
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return (data as AlbumRow) ?? null;
  }

  async listByUser(userId: string): Promise<AlbumRow[]> {
    const { data, error } = await this.supabase.admin
      .from(this.TABLE)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as AlbumRow[];
  }

  async listPublicByUser(userId: string): Promise<AlbumRow[]> {
    const { data, error } = await this.supabase.admin
      .from(this.TABLE)
      .select('*')
      .eq('user_id', userId)
      .eq('is_public', true)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as AlbumRow[];
  }

  async update(userId: string, id: string, patch: AlbumWritable): Promise<AlbumRow | null> {
    const { data, error } = await this.supabase.admin
      .from(this.TABLE)
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId)
      .select('*')
      .maybeSingle();
    if (error) throw error;
    return (data as AlbumRow) ?? null;
  }

  async delete(userId: string, id: string): Promise<void> {
    const { error } = await this.supabase.admin
      .from(this.TABLE)
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
    if (error) throw error;
  }

  /**
   * Attach the given posts to an album — only posts owned by `userId` are moved
   * (foreign posts are silently ignored). Returns the number of rows changed.
   */
  async attachPosts(userId: string, albumId: string, postIds: string[]): Promise<number> {
    if (postIds.length === 0) return 0;
    const { data, error } = await this.supabase.admin
      .from('posts')
      .update({ album_id: albumId })
      .in('id', postIds)
      .eq('user_id', userId)
      .select('id');
    if (error) throw error;
    return data?.length ?? 0;
  }

  /** Detach a single post from an album (back to the pool). */
  async detachPost(userId: string, albumId: string, postId: string): Promise<number> {
    const { data, error } = await this.supabase.admin
      .from('posts')
      .update({ album_id: null })
      .eq('id', postId)
      .eq('album_id', albumId)
      .eq('user_id', userId)
      .select('id');
    if (error) throw error;
    return data?.length ?? 0;
  }

  /** Posts in an album, newest first. `onlyPublic` hides private posts for outside viewers. */
  async postsOf(albumId: string, onlyPublic = false): Promise<PostRow[]> {
    let query = this.supabase.admin
      .from('posts')
      .select('*, profiles!inner(id, username, avatar_url), categories(id, name, icon, color_hex, type)')
      .eq('album_id', albumId);
    if (onlyPublic) query = query.eq('is_private', false);
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as PostRow[];
  }

  /**
   * Per-album aggregates for a user's albums. Prefers the `get_album_summaries`
   * RPC; falls back to a client-side computation if the RPC is absent.
   */
  async statsForUser(userId: string, albumIds: string[]): Promise<Map<string, AlbumStat>> {
    if (albumIds.length === 0) return new Map();

    const rpc = await this.supabase.admin.rpc('get_album_summaries', { p_user_id: userId });
    if (!rpc.error && rpc.data) {
      const rows = rpc.data as Array<{
        album_id: string;
        post_count: number | string;
        spent: number | string;
        income: number | string | null;
        latest_cover: string | null;
      }>;
      return new Map(
        rows.map((r) => [
          r.album_id,
          {
            album_id: r.album_id,
            post_count: Number(r.post_count),
            spent: Number(r.spent),
            income: Number(r.income ?? 0), // 0 until the RPC is re-deployed with the income column
            latest_cover: r.latest_cover,
          },
        ]),
      );
    }

    return this.computeStats(albumIds);
  }

  /** Aggregate for a single album (used by detail). */
  async statsForAlbum(albumId: string): Promise<AlbumStat> {
    const map = await this.computeStats([albumId]);
    return map.get(albumId) ?? { album_id: albumId, post_count: 0, spent: 0, income: 0, latest_cover: null };
  }

  /** RPC-free fallback: one pass over the albums' posts. */
  private async computeStats(albumIds: string[]): Promise<Map<string, AlbumStat>> {
    const { data, error } = await this.supabase.admin
      .from('posts')
      .select('album_id, amount, photo_url, created_at, categories(type)')
      .in('album_id', albumIds)
      .order('created_at', { ascending: false });
    if (error) throw error;

    const map = new Map<string, AlbumStat>(
      albumIds.map((id) => [id, { album_id: id, post_count: 0, spent: 0, income: 0, latest_cover: null }]),
    );

    for (const row of data ?? []) {
      const p = row as unknown as {
        album_id: string;
        amount: number;
        photo_url: string | null;
        created_at: string;
        categories: { type: string } | { type: string }[] | null;
      };
      const stat = map.get(p.album_id);
      if (!stat) continue;
      stat.post_count += 1;
      // Rows arrive newest-first → the first photo we see is the latest cover.
      if (stat.latest_cover === null && p.photo_url) stat.latest_cover = p.photo_url;
      const cat = Array.isArray(p.categories) ? p.categories[0] : p.categories;
      if (cat?.type === 'EXPENSE') stat.spent += Number(p.amount);
      else if (cat?.type === 'INCOME') stat.income += Number(p.amount);
    }
    return map;
  }
}
