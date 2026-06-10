export type CategoryType = 'EXPENSE' | 'INCOME' | 'SAVING' | 'GOAL';

export interface Profile {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  current_streak: number;
  highest_streak: number;
  last_post_date: string | null;
}

export interface Category {
  id: string;
  user_id: string | null;
  name: string;
  type: CategoryType;
  icon: string;
  color_hex: string;
}

/** Aggregated reactions on a post, from the viewer's perspective. */
export interface ReactionSummary {
  emoji: string;
  count: number;
  reacted: boolean; // viewer reacted with this emoji
}

/** Emoji friends can react with — keep in sync with BE reactions.constants.ts. */
export const REACTION_EMOJIS = ['❤️', '😂', '😮', '😢', '🔥', '👏'] as const;

export interface FeedPost {
  id: string;
  user_id: string;
  category_id: string;
  photo_url: string;
  amount: number;
  note: string | null;
  is_private: boolean;
  created_at: string;
  /** null ⇒ post nằm ở pool (feed); có giá trị ⇒ thuộc 1 album. */
  album_id?: string | null;
  profiles: { id: string; username: string; avatar_url: string | null };
  categories: Pick<Category, 'id' | 'name' | 'icon' | 'color_hex' | 'type'>;
  /** Present when the new expense touches one or more budgets (optional, backward-compatible). */
  budget_impact?: BudgetImpact[];
  /** Reaction summary attached by the BE on feed/mine (optional, backward-compatible). */
  reactions?: ReactionSummary[];
}

/* ------------------------------------------------------------------ */
/* Albums                                                              */
/* ------------------------------------------------------------------ */

export interface Album {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  cover_photo_url: string | null;   // BE đã fallback ảnh post mới nhất
  is_public: boolean;
  budget_amount: number | null;
  start_date: string | null;        // 'YYYY-MM-DD'
  end_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface AlbumSummary extends Album {
  post_count: number;
  spent: number;                    // tổng CHI (EXPENSE)
  income: number;                   // tổng THU (INCOME)
  remaining: number | null;         // null nếu chưa đặt budget
}

export interface AlbumDetail extends AlbumSummary {
  posts: FeedPost[];                // post trong album, mới nhất trước
}

export type BudgetPeriod = 'DAY' | 'MONTH' | 'YEAR';

export interface BudgetStatus {
  id: string;
  user_id: string;
  category_id: string | null;
  period_type: BudgetPeriod;
  period_start: string;     // 'YYYY-MM-DD'
  amount: number;
  category: { id: string; name: string; icon: string; color_hex: string } | null; // null = tổng
  spent: number;
  remaining: number;        // có thể âm khi vượt
  percent: number;          // spent/amount (0..1+)
  is_over: boolean;
  created_at: string;
  updated_at: string;
}

export interface BudgetImpact {
  budget_id: string;
  period_type: BudgetPeriod;
  category_id: string | null;
  remaining: number;
  is_over: boolean;
}

export interface MonthStat {
  category_id: string;
  category_name: string;
  color_hex: string;
  icon: string;
  total: number;
}

/** A public, lightweight projection of another user. */
export interface ProfileSummary {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
}

export type FriendshipStatus = 'PENDING' | 'ACCEPTED' | 'BLOCKED';

export interface Friendship {
  id: string;
  requester_id: string;
  receiver_id: string;
  status: FriendshipStatus;
  created_at: string;
}

/** A friendship row with the other party's profile joined (per endpoint). */
export interface FriendshipWithProfile extends Friendship {
  requester?: ProfileSummary | null;
  receiver?: ProfileSummary | null;
}
