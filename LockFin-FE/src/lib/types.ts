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

export interface FeedPost {
  id: string;
  user_id: string;
  category_id: string;
  photo_url: string;
  amount: number;
  note: string | null;
  is_private: boolean;
  created_at: string;
  profiles: { id: string; username: string; avatar_url: string | null };
  categories: Pick<Category, 'id' | 'name' | 'icon' | 'color_hex' | 'type'>;
  /** Present when the new expense touches one or more budgets (optional, backward-compatible). */
  budget_impact?: BudgetImpact[];
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
