import { useQuery, useInfiniteQuery, useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { api } from './api';
import type {
  Profile, Category, FeedPost, MonthStat, CategoryType,
  Friendship, FriendshipWithProfile, ProfileSummary,
  BudgetStatus, BudgetPeriod,
  AlbumSummary, AlbumDetail, ReactionSummary,
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
  budgets: (date: string) => ['budgets', date] as const,
  albums: ['albums'] as const,
  album: (id: string) => ['album', id] as const,
  userAlbums: (uid: string) => ['albums', 'user', uid] as const,
  userProfile: (uid: string) => ['profile', 'user', uid] as const,
};

export const useProfile = () =>
  useQuery({ queryKey: qk.profile, queryFn: () => api<Profile>('/profiles/me') });

/** Public profile of another user (name/avatar/username). */
export const useUserProfile = (userId: string) =>
  useQuery({
    queryKey: qk.userProfile(userId),
    queryFn: () => api<ProfileSummary>(`/profiles/${userId}`),
    enabled: !!userId,
  });

export interface UpdateProfileInput {
  display_name?: string;
  avatar_url?: string | null;
}

/** Update the signed-in user's display name / avatar (username is immutable). */
export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateProfileInput) =>
      api<Profile>('/profiles/me', { method: 'PATCH', body: JSON.stringify(body) }),
    onSuccess: (next) => {
      qc.setQueryData(qk.profile, next);
      // Author name/avatar appears on feed + own posts.
      qc.invalidateQueries({ queryKey: qk.feed });
      qc.invalidateQueries({ queryKey: ['posts', 'mine'] });
    },
  });
}

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
  /** Đích lưu: có ⇒ vào album đó; bỏ/null ⇒ lên pool (feed). */
  album_id?: string | null;
}

export function useCreatePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreatePostInput) =>
      api<FeedPost>('/posts', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: (post) => {
      qc.invalidateQueries({ queryKey: qk.profile });
      qc.invalidateQueries({ queryKey: qk.feed });
      qc.invalidateQueries({ queryKey: ['posts', 'mine'] });
      qc.invalidateQueries({ queryKey: ['stats'] });
      qc.invalidateQueries({ queryKey: ['budgets'] });
      // Post vào album đổi summary (spent/cover/count) của album + danh sách album.
      if (post.album_id) {
        qc.invalidateQueries({ queryKey: qk.album(post.album_id) });
        qc.invalidateQueries({ queryKey: qk.albums });
      }
    },
  });
}

/* ------------------------------------------------------------------ */
/* Albums                                                              */
/* ------------------------------------------------------------------ */

/** Album của chính user, mới nhất trước. */
export const useAlbums = () =>
  useQuery({ queryKey: qk.albums, queryFn: () => api<AlbumSummary[]>('/albums') });

export const useAlbum = (id: string) =>
  useQuery({
    queryKey: qk.album(id),
    queryFn: () => api<AlbumDetail>(`/albums/${id}`),
    enabled: !!id,
  });

/** Album public của user khác (dành cho trang profile người khác). */
export const useUserAlbums = (userId: string) =>
  useQuery({
    queryKey: qk.userAlbums(userId),
    queryFn: () => api<AlbumSummary[]>(`/profiles/${userId}/albums`),
    enabled: !!userId,
  });

export interface CreateAlbumInput {
  name: string;
  description?: string;
  is_public?: boolean;
  budget_amount?: number | null;
  start_date?: string;
  end_date?: string;
  post_ids?: string[];      // gắn sẵn post đang có
}

export function useCreateAlbum() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateAlbumInput) =>
      api<AlbumDetail>('/albums', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.albums });
      qc.invalidateQueries({ queryKey: ['posts', 'mine'] }); // post vừa gắn có album_id
      qc.invalidateQueries({ queryKey: qk.feed });           // post rời pool
    },
  });
}

export function useUpdateAlbum() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...patch }: { id: string } & Partial<CreateAlbumInput>) =>
      api<AlbumDetail>(`/albums/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: qk.albums });
      qc.invalidateQueries({ queryKey: qk.album(v.id) });
    },
  });
}

export function useDeleteAlbum() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api<void>(`/albums/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.albums });
      qc.invalidateQueries({ queryKey: ['posts', 'mine'] }); // post quay về pool
      qc.invalidateQueries({ queryKey: qk.feed });
    },
  });
}

export function useAddPostsToAlbum() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, post_ids }: { id: string; post_ids: string[] }) =>
      api<AlbumDetail>(`/albums/${id}/posts`, { method: 'POST', body: JSON.stringify({ post_ids }) }),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: qk.album(v.id) });
      qc.invalidateQueries({ queryKey: qk.albums });
      qc.invalidateQueries({ queryKey: qk.feed });           // post rời pool
      qc.invalidateQueries({ queryKey: ['posts', 'mine'] });
    },
  });
}

export function useRemovePostFromAlbum() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, postId }: { id: string; postId: string }) =>
      api<AlbumDetail>(`/albums/${id}/posts/${postId}`, { method: 'DELETE' }),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: qk.album(v.id) });
      qc.invalidateQueries({ queryKey: qk.albums });
      qc.invalidateQueries({ queryKey: qk.feed });           // post về lại pool
      qc.invalidateQueries({ queryKey: ['posts', 'mine'] });
    },
  });
}

/* ------------------------------------------------------------------ */
/* Budgets                                                             */
/* ------------------------------------------------------------------ */

const todayIso = () => new Date().toISOString().slice(0, 10);

/** Budgets covering a given day (default: today). BE returns spent/remaining/percent. */
export const useBudgets = (date = todayIso()) =>
  useQuery({
    queryKey: qk.budgets(date),
    queryFn: () => api<BudgetStatus[]>(`/budgets?date=${date}`),
  });

export interface UpsertBudgetInput {
  category_id?: string | null;
  period_type: BudgetPeriod;
  period_start: string;   // ngày bất kỳ trong kỳ, BE tự chuẩn hoá
  amount: number;
}

export function useUpsertBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: UpsertBudgetInput) =>
      api<BudgetStatus>('/budgets', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['budgets'] }),
  });
}

export function useUpdateBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, amount }: { id: string; amount: number }) =>
      api<BudgetStatus>(`/budgets/${id}`, { method: 'PATCH', body: JSON.stringify({ amount }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['budgets'] }),
  });
}

export function useDeleteBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api<void>(`/budgets/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['budgets'] }),
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

/* ------------------------------------------------------------------ */
/* Reactions                                                           */
/* ------------------------------------------------------------------ */

type FeedInfinite = { pages: FeedPost[][]; pageParams: unknown[] };

/** Toggle a viewer's emoji on a post's reaction list (client-side preview). */
export function toggleLocal(list: ReactionSummary[] = [], emoji: string): ReactionSummary[] {
  const existing = list.find((r) => r.emoji === emoji);
  if (existing?.reacted) {
    const count = existing.count - 1;
    return count <= 0
      ? list.filter((r) => r.emoji !== emoji)
      : list.map((r) => (r.emoji === emoji ? { ...r, count, reacted: false } : r));
  }
  if (existing) {
    return list.map((r) => (r.emoji === emoji ? { ...r, count: r.count + 1, reacted: true } : r));
  }
  return [...list, { emoji, count: 1, reacted: true }];
}

/** Apply a reaction transform to a post wherever it's cached (feed + every mine month). */
function transformReactions(
  qc: QueryClient,
  postId: string,
  fn: (r: ReactionSummary[]) => ReactionSummary[],
) {
  qc.setQueryData<FeedInfinite>(qk.feed, (old) =>
    old
      ? { ...old, pages: old.pages.map((pg) => pg.map((p) => (p.id === postId ? { ...p, reactions: fn(p.reactions ?? []) } : p))) }
      : old,
  );
  qc.setQueriesData<FeedPost[]>({ queryKey: ['posts', 'mine'] }, (old) =>
    Array.isArray(old) ? old.map((p) => (p.id === postId ? { ...p, reactions: fn(p.reactions ?? []) } : p)) : old,
  );
}

export function useToggleReaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ postId, emoji }: { postId: string; emoji: string }) =>
      api<ReactionSummary[]>(`/posts/${postId}/reactions`, {
        method: 'POST',
        body: JSON.stringify({ emoji }),
      }),
    // Snappy preview, then reconcile with the server's authoritative summary.
    onMutate: ({ postId, emoji }) => transformReactions(qc, postId, (r) => toggleLocal(r, emoji)),
    onSuccess: (data, { postId }) => transformReactions(qc, postId, () => data),
    onError: () => {
      qc.invalidateQueries({ queryKey: qk.feed });
      qc.invalidateQueries({ queryKey: ['posts', 'mine'] });
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
