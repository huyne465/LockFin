import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './api';
import type { Profile, Category, FeedPost, MonthStat, CategoryType } from './types';

export const qk = {
  profile: ['profile', 'me'] as const,
  categories: ['categories'] as const,
  feed: ['feed'] as const,
  mine: (month: string) => ['posts', 'mine', month] as const,
  stats: (month: string) => ['stats', month] as const,
};

export const useProfile = () =>
  useQuery({ queryKey: qk.profile, queryFn: () => api<Profile>('/profiles/me') });

export const useCategories = () =>
  useQuery({ queryKey: qk.categories, queryFn: () => api<Category[]>('/categories') });

const FEED_LIMIT = 20;

export const useFeed = () =>
  useInfiniteQuery({
    queryKey: qk.feed,
    queryFn: ({ pageParam = 0 }) =>
      api<FeedPost[]>(`/posts/feed?limit=${FEED_LIMIT}&offset=${pageParam}`),
    initialPageParam: 0,
    getNextPageParam: (last, all) => (last.length < FEED_LIMIT ? undefined : all.length * FEED_LIMIT),
  });

export const useMonthStats = (month: string) =>
  useQuery({ queryKey: qk.stats(month), queryFn: () => api<MonthStat[]>(`/posts/stats?month=${month}`) });

/** The signed-in user's own photo pool for a given month (includes private). */
export const useMyPosts = (month: string) =>
  useQuery({ queryKey: qk.mine(month), queryFn: () => api<FeedPost[]>(`/posts/mine?month=${month}`) });

export interface CreatePostInput {
  category_id: string;
  photo_url: string;
  amount: number;
  note?: string;
  is_private?: boolean;
}

export function useCreatePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreatePostInput) =>
      api<FeedPost>('/posts', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.profile });
      qc.invalidateQueries({ queryKey: qk.feed });
      qc.invalidateQueries({ queryKey: ['posts', 'mine'] });
      qc.invalidateQueries({ queryKey: ['stats'] });
    },
  });
}

export interface CreateCategoryInput {
  name: string; type: CategoryType; icon: string; color_hex: string;
}
export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateCategoryInput) =>
      api<Category>('/categories', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.categories }),
  });
}
