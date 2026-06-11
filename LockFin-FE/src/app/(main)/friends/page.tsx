'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Check, Clock, Copy, Search, Share2, UserPlus, X } from 'lucide-react';
import {
  useAcceptFriendRequest,
  useFriends,
  useFriendshipsRealtime,
  useIncomingRequests,
  useOutgoingRequests,
  useProfile,
  useProfileSearch,
  useRemoveFriendship,
  useSendFriendRequest,
} from '@/lib/queries';
import { useToast } from '@/components/ui/Toast';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import type { FriendshipWithProfile, ProfileSummary } from '@/lib/types';

const FRIEND_ERROR_MAP: Record<string, string> = {
  'You cannot add yourself as a friend': 'Bạn không thể tự kết bạn với chính mình.',
  'You are already friends': 'Hai bạn đã là bạn bè rồi.',
  'Friend request already sent': 'Bạn đã gửi lời mời cho người này rồi.',
  'This user is unavailable': 'Không thể kết bạn với người này.',
};

function friendlyError(e: unknown): string {
  const msg = e instanceof Error ? e.message : '';
  return FRIEND_ERROR_MAP[msg] ?? msg ?? 'Có lỗi xảy ra, thử lại nhé.';
}

const nameOf = (p?: ProfileSummary | null) =>
  p?.display_name?.trim() || p?.username?.trim() || 'Người dùng';

function Avatar({ profile, size = 44 }: { profile?: ProfileSummary | null; size?: number }) {
  const initial = nameOf(profile)[0]?.toUpperCase() ?? '?';
  return (
    <div
      className="shrink-0 overflow-hidden rounded-full bg-surface-muted"
      style={{ height: size, width: size }}
    >
      {profile?.avatar_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center font-display font-semibold text-text-secondary">
          {initial}
        </div>
      )}
    </div>
  );
}

function Row({
  profile,
  href,
  children,
}: {
  profile?: ProfileSummary | null;
  href?: string;
  children?: React.ReactNode;
}) {
  const inner = (
    <>
      <Avatar profile={profile} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-text">{nameOf(profile)}</p>
        {profile?.username && (
          <p className="truncate text-xs text-text-muted">@{profile.username}</p>
        )}
      </div>
    </>
  );
  return (
    <li className="flex items-center gap-3 rounded-2xl bg-surface px-3.5 py-2.5 shadow-card">
      {href ? (
        <Link href={href} className="flex min-w-0 flex-1 items-center gap-3">
          {inner}
        </Link>
      ) : (
        <div className="flex min-w-0 flex-1 items-center gap-3">{inner}</div>
      )}
      <div className="flex shrink-0 items-center gap-1.5">{children}</div>
    </li>
  );
}

function IconButton({
  label,
  tone = 'neutral',
  onClick,
  disabled,
  children,
}: {
  label: string;
  tone?: 'primary' | 'danger' | 'neutral';
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  const tones = {
    primary: 'bg-primary text-text-inverse hover:bg-primary-hover',
    danger: 'bg-surface-muted text-danger hover:bg-danger/10',
    neutral: 'bg-surface-muted text-text-secondary hover:bg-border',
  } as const;
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className={`flex h-11 w-11 items-center justify-center rounded-full transition-all duration-fast active:scale-90 disabled:opacity-40 ${tones[tone]}`}
    >
      {children}
    </button>
  );
}

function SectionTitle({ children, count }: { children: React.ReactNode; count?: number }) {
  return (
    <h2 className="mb-2 mt-6 flex items-center gap-2 px-1 text-sm font-semibold text-text-secondary">
      {children}
      {count != null && count > 0 && (
        <span className="numeric rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
          {count}
        </span>
      )}
    </h2>
  );
}

export default function FriendsPage() {
  const push = useToast((s) => s.push);
  const me = useProfile();
  useFriendshipsRealtime(me.data?.id);

  const friends = useFriends();
  const incoming = useIncomingRequests();
  const outgoing = useOutgoingRequests();

  const sendRequest = useSendFriendRequest();
  const acceptRequest = useAcceptFriendRequest();
  const removeFriendship = useRemoveFriendship();

  // Debounced search term.
  const [term, setTerm] = useState('');
  const [debounced, setDebounced] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setDebounced(term.trim()), 300);
    return () => clearTimeout(t);
  }, [term]);
  const search = useProfileSearch(debounced);

  // IDs the current user already has any relationship with — hide from results.
  const relatedIds = useMemo(() => {
    const ids = new Set<string>();
    if (me.data) ids.add(me.data.id);
    const collect = (list?: FriendshipWithProfile[]) =>
      list?.forEach((f) => {
        ids.add(f.requester_id);
        ids.add(f.receiver_id);
      });
    collect(friends.data);
    collect(incoming.data);
    collect(outgoing.data);
    return ids;
  }, [me.data, friends.data, incoming.data, outgoing.data]);

  const results = (search.data ?? []).filter((p) => !relatedIds.has(p.id));

  async function inviteFriends() {
    const username = me.data?.username;
    const url = `${window.location.origin}/signup${username ? `?ref=${username}` : ''}`;
    const text = username
      ? `Tham gia LockFin cùng mình nhé! Kết bạn với mình @${username} để cùng theo dõi chi tiêu.`
      : 'Tham gia LockFin cùng mình để cùng theo dõi chi tiêu nhé!';
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: 'LockFin', text, url });
      } catch {
        // User huỷ hộp chia sẻ — bỏ qua.
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(`${text} ${url}`);
      push('Đã copy lời mời, gửi cho bạn bè nhé', 'success');
    } catch {
      push('Không copy được, thử lại nhé', 'error');
    }
  }

  async function copyUsername(username?: string | null) {
    if (!username) return;
    try {
      await navigator.clipboard.writeText(`@${username}`);
      push('Đã copy username 📋', 'success');
    } catch {
      push('Không copy được, thử lại nhé', 'error');
    }
  }

  async function onSend(p: ProfileSummary) {
    try {
      const res = await sendRequest.mutateAsync(p.id);
      if (res.status === 'ACCEPTED') {
        push(`Đã trở thành bạn bè với ${nameOf(p)} 🎉`, 'success');
      } else {
        push(`Đã gửi lời mời tới ${nameOf(p)}`, 'success');
      }
      setTerm('');
    } catch (e) {
      push(friendlyError(e), 'error');
    }
  }

  async function onAccept(f: FriendshipWithProfile) {
    try {
      await acceptRequest.mutateAsync(f.id);
      push('Đã chấp nhận lời mời 🎉', 'success');
    } catch (e) {
      push(friendlyError(e), 'error');
    }
  }

  async function onRemove(id: string, doneMsg: string) {
    try {
      await removeFriendship.mutateAsync(id);
      push(doneMsg, 'info');
    } catch (e) {
      push(friendlyError(e), 'error');
    }
  }

  const incomingList = incoming.data ?? [];
  const outgoingList = outgoing.data ?? [];
  const friendsList = friends.data ?? [];

  return (
    <div className="min-h-full bg-background">
      <header className="sticky top-0 z-30 glass flex items-center gap-2 px-3 py-3.5 safe-top">
        <Link
          href="/profile"
          aria-label="Quay lại"
          className="flex h-11 w-11 items-center justify-center rounded-full text-text-secondary transition-transform duration-fast active:scale-90"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="font-display text-lg font-bold">Bạn bè</h1>
      </header>

      <div className="px-4 pb-8">
        {/* Share your own username so friends can add you */}
        {me.data?.username && (
          <button
            type="button"
            onClick={() => copyUsername(me.data?.username)}
            className="mt-4 flex w-full items-center gap-3 rounded-2xl bg-primary/5 px-4 py-3 text-left ring-1 ring-primary/15 transition-colors duration-fast hover:bg-primary/10"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Copy className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-xs text-text-muted">Username của bạn — gửi để bạn bè kết bạn</span>
              <span className="block truncate font-semibold text-text">@{me.data.username}</span>
            </span>
            <span className="shrink-0 text-xs font-medium text-primary">Copy</span>
          </button>
        )}

        {/* Invite new users to LockFin */}
        <button
          type="button"
          onClick={inviteFriends}
          className="mt-3 flex w-full items-center gap-3 rounded-2xl bg-surface px-4 py-3 text-left shadow-card transition-colors duration-fast hover:bg-surface-muted"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Share2 className="h-5 w-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-xs text-text-muted">Rủ bạn bè chưa dùng LockFin</span>
            <span className="block truncate font-semibold text-text">Mời bạn bè tham gia</span>
          </span>
          <span className="shrink-0 text-xs font-medium text-primary">Chia sẻ</span>
        </button>

        {/* Add friend */}
        <div className="relative mt-4">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Tìm bạn theo tên hoặc @username"
            className="w-full rounded-full border border-border bg-surface py-3 pl-10 pr-4 text-text placeholder:text-text-muted focus:border-primary transition-colors duration-fast"
          />
        </div>

        {debounced.length > 0 && (
          <ul className="mt-3 space-y-2">
            {search.isLoading && <Skeleton className="h-16 w-full rounded-2xl" />}
            {!search.isLoading && results.length === 0 && (
              <li className="px-1 py-4 text-center text-sm text-text-muted">
                Không tìm thấy ai phù hợp.
              </li>
            )}
            {results.map((p) => (
              <Row key={p.id} profile={p} href={`/profile/${p.id}`}>
                <IconButton
                  label="Copy username"
                  onClick={() => copyUsername(p.username)}
                >
                  <Copy className="h-4 w-4" />
                </IconButton>
                <IconButton
                  label="Kết bạn"
                  tone="primary"
                  onClick={() => onSend(p)}
                  disabled={sendRequest.isPending}
                >
                  <UserPlus className="h-4 w-4" />
                </IconButton>
              </Row>
            ))}
          </ul>
        )}

        {/* Incoming requests */}
        {incomingList.length > 0 && (
          <>
            <SectionTitle count={incomingList.length}>Lời mời kết bạn</SectionTitle>
            <ul className="space-y-2">
              {incomingList.map((f) => (
                <Row key={f.id} profile={f.requester}>
                  <IconButton
                    label="Chấp nhận"
                    tone="primary"
                    onClick={() => onAccept(f)}
                    disabled={acceptRequest.isPending}
                  >
                    <Check className="h-4 w-4" />
                  </IconButton>
                  <IconButton
                    label="Từ chối"
                    tone="danger"
                    onClick={() => onRemove(f.id, 'Đã từ chối lời mời')}
                    disabled={removeFriendship.isPending}
                  >
                    <X className="h-4 w-4" />
                  </IconButton>
                </Row>
              ))}
            </ul>
          </>
        )}

        {/* Outgoing requests */}
        {outgoingList.length > 0 && (
          <>
            <SectionTitle count={outgoingList.length}>Đã gửi</SectionTitle>
            <ul className="space-y-2">
              {outgoingList.map((f) => (
                <Row key={f.id} profile={f.receiver}>
                  <span className="flex items-center gap-1 text-xs text-text-muted">
                    <Clock className="h-3.5 w-3.5" /> Đang chờ
                  </span>
                  <IconButton
                    label="Huỷ lời mời"
                    tone="danger"
                    onClick={() => onRemove(f.id, 'Đã huỷ lời mời')}
                    disabled={removeFriendship.isPending}
                  >
                    <X className="h-4 w-4" />
                  </IconButton>
                </Row>
              ))}
            </ul>
          </>
        )}

        {/* Friends */}
        <SectionTitle count={friendsList.length}>Bạn bè</SectionTitle>
        {friends.isLoading && <Skeleton className="h-16 w-full rounded-2xl" />}
        {!friends.isLoading && friendsList.length === 0 && (
          <EmptyState
            icon="🫂"
            title="Chưa có bạn bè nào"
            hint="Tìm bạn ở ô trên để cùng xem feed chi tiêu của nhau."
          />
        )}
        <ul className="space-y-2">
          {friendsList.map((f) => {
            const other = f.requester_id === me.data?.id ? f.receiver : f.requester;
            return (
              <Row key={f.id} profile={other} href={other ? `/profile/${other.id}` : undefined}>
                <IconButton label="Copy username" onClick={() => copyUsername(other?.username)}>
                  <Copy className="h-4 w-4" />
                </IconButton>
                <IconButton
                  label="Huỷ kết bạn"
                  tone="danger"
                  onClick={() => onRemove(f.id, 'Đã huỷ kết bạn')}
                  disabled={removeFriendship.isPending}
                >
                  <X className="h-4 w-4" />
                </IconButton>
              </Row>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
