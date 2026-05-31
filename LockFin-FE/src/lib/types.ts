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
}

export interface MonthStat {
  category_id: string;
  category_name: string;
  color_hex: string;
  icon: string;
  total: number;
}
