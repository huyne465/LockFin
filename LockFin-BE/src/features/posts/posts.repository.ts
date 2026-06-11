import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../../core/supabase/supabase.service';
import { CreatePostDto } from './dto/create-post.dto';

export interface PostRow {
  id: string;
  user_id: string;
  category_id: string;
  photo_url: string;
  amount: number;
  note: string | null;
  is_private: boolean;
  album_id: string | null;
  created_at: string;
}

export interface CategoryStat {
  category_id: string;
  category_name: string | null;
  color_hex: string | null;
  icon: string | null;
  total: number;
}

@Injectable()
export class PostsRepository {
  private readonly TABLE = 'posts';

  constructor(private readonly supabase: SupabaseService) { }

  async create(userId: string, dto: CreatePostDto): Promise<PostRow> {
    const { data, error } = await this.supabase.admin
      .from(this.TABLE)
      .insert({
        user_id: userId,
        category_id: dto.category_id,
        photo_url: dto.photo_url,
        amount: dto.amount,
        note: dto.note ?? null,
        is_private: dto.is_private ?? false,
        album_id: dto.album_id ?? null,
      })
      .select('*')
      .single();
    if (error) throw error;
    return data as PostRow;
  }

  /**
   * Feed for a user: public posts authored by the given set of users
   * (their accepted friends plus themselves). Private posts are excluded.
   */
  async feed(authorIds: string[], limit = 20, offset = 0): Promise<PostRow[]> {
    if (authorIds.length === 0) return [];
    const { data, error } = await this.supabase.admin
      .from(this.TABLE)
      .select('*, profiles!inner(id, username, display_name, avatar_url), categories(id, name, icon, color_hex, type)')
      .in('user_id', authorIds)
      .eq('is_private', false)
      .is('album_id', null) // posts filed into an album are viewed per-album, not in the pool feed
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    if (error) throw error;
    return (data ?? []) as PostRow[];
  }

  /** The signed-in user's own posts (includes private). Optionally scoped to a month. */
  async mine(userId: string, month?: string, limit = 200, offset = 0): Promise<PostRow[]> {
    let query = this.supabase.admin
      .from(this.TABLE)
      .select('*, profiles!inner(id, username, display_name, avatar_url), categories(id, name, icon, color_hex, type)')
      .eq('user_id', userId);

    if (month) {
      query = query.gte('created_at', `${month}-01`).lt('created_at', this.nextMonthIso(month));
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    if (error) throw error;
    return (data ?? []) as PostRow[];
  }

  /**
   * Aggregate amount by category for a given user/month.
   * Prefers an RPC (`get_monthly_stats`) if present, else falls back to client-side reduce.
   */
  async statsByCategory(userId: string, month: string): Promise<CategoryStat[]> {
    const rpc = await this.supabase.admin.rpc('get_monthly_stats', {
      p_user_id: userId,
      p_month: `${month}-01`,
    });
    if (!rpc.error && rpc.data) {
      return rpc.data as CategoryStat[];
    }

    const start = `${month}-01`;
    const end = this.nextMonthIso(month);
    const { data, error } = await this.supabase.admin
      .from(this.TABLE)
      .select('category_id, amount, categories(name, color_hex, icon)')
      .eq('user_id', userId)
      .gte('created_at', start)
      .lt('created_at', end);
    if (error) throw error;

    const map = new Map<string, CategoryStat>();
    for (const row of data ?? []) {
      const r = row as unknown as {
        category_id: string;
        amount: number;
        categories:
        | { name: string | null; color_hex: string | null; icon: string | null }
        | { name: string | null; color_hex: string | null; icon: string | null }[]
        | null;
      };
      const cat = Array.isArray(r.categories) ? r.categories[0] ?? null : r.categories;
      const existing = map.get(r.category_id);
      if (existing) {
        existing.total += Number(r.amount);
      } else {
        map.set(r.category_id, {
          category_id: r.category_id,
          category_name: cat?.name ?? null,
          color_hex: cat?.color_hex ?? null,
          icon: cat?.icon ?? null,
          total: Number(r.amount),
        });
      }
    }
    return Array.from(map.values());
  }

  private nextMonthIso(month: string): string {
    const [y, m] = month.split('-').map(Number);
    const next = new Date(Date.UTC(y, m, 1));
    return next.toISOString().slice(0, 10);
  }
}
