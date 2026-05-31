import { useQuery, useInfiniteQuery, useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { api } from './api';
import type {
  Profile, Category, FeedPost, MonthStat, CategoryType,
  Friendship, FriendshipWithProfile, ProfileSummary,
} from './types';

export const qk = {
  profile: ['profile', 'me'] as const,
  categories: ['categories'] as const,
  feed: ['feed'] as const,
  mine: (month: string) => ['posts', 'mine', month] as const,
  stats: (month: string) => ['stats', month] as const,
  profileSearch: (q: string) => ['profiles', 'search', q] as const,
  friends: ['friends'] as const,
  friendsIncoming: ['friends', 'incoming'] as const,
  friendsOutgoing: ['friends', 'outgoing'] as const,
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

/* ------------------------------------------------------------------ */
/* Friends                                                             */
/* ------------------------------------------------------------------ */

/** Search other users to add as friends. Disabled until the query is non-empty. */
export function useProfileSearch(query: string) {
  const q = query.trim();
  return useQuery({
    queryKey: qk.profileSearch(q),
    queryFn: () => api<ProfileSummary[]>(`/profiles/search?q=${encodeURIComponent(q)}`),
    enabled: q.length > 0,
    staleTime: 10_000,
  });
}

export const useFriends = () =>
  useQuery({ queryKey: qk.friends, queryFn: () => api<FriendshipWithProfile[]>('/friends') });

export const useIncomingRequests = () =>
  useQuery({ queryKey: qk.friendsIncoming, queryFn: () => api<FriendshipWithProfile[]>('/friends/requests/incoming') });

export const useOutgoingRequests = () =>
  useQuery({ queryKey: qk.friendsOutgoing, queryFn: () => api<FriendshipWithProfile[]>('/friends/requests/outgoing') });

/** A single friendship change ripples across all three lists + the shared feed. */
function invalidateFriendData(qc: QueryClient) {
  qc.invalidateQueries({ queryKey: qk.friends });
  qc.invalidateQueries({ queryKey: qk.friendsIncoming });
  qc.invalidateQueries({ queryKey: qk.friendsOutgoing });
  qc.invalidateQueries({ queryKey: qk.feed });
}

export function useSendFriendRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (receiverId: string) =>
      api<Friendship>('/friends/requests', {
        method: 'POST',
        body: JSON.stringify({ receiver_id: receiverId }),
      }),
    onSuccess: () => invalidateFriendData(qc),
  });
}

export function useAcceptFriendRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api<Friendship>(`/friends/${id}/accept`, { method: 'PATCH' }),
    onSuccess: () => invalidateFriendData(qc),
  });
}

/** Decline an incoming request, cancel a sent one, or unfriend — all DELETE /friends/:id. */
export function useRemoveFriendship() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api<void>(`/friends/${id}`, { method: 'DELETE' }),
    onSuccess: () => invalidateFriendData(qc),
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
