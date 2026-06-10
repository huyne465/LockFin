'use client';

import { useEffect, useState } from 'react';
import { SmilePlus } from 'lucide-react';
import { clsx } from 'clsx';
import { toggleLocal, useToggleReaction } from '@/lib/queries';
import { REACTION_EMOJIS, type ReactionSummary } from '@/lib/types';

/**
 * Reaction bar for a post: existing reaction chips + an emoji picker.
 * Keeps a local copy so it updates instantly even when rendered from a
 * snapshot (e.g. the memories lightbox), then reconciles with the server.
 */
export function PostReactions({
  postId,
  reactions = [],
  tone = 'light',
}: {
  postId: string;
  reactions?: ReactionSummary[];
  tone?: 'light' | 'dark';
}) {
  const [local, setLocal] = useState<ReactionSummary[]>(reactions);
  const [open, setOpen] = useState(false);
  const toggle = useToggleReaction();
  const dark = tone === 'dark';

  // Resync when the parent hands us fresh data (feed refetch / cache patch).
  useEffect(() => setLocal(reactions), [reactions]);

  function react(emoji: string) {
    setLocal((r) => toggleLocal(r, emoji)); // instant local preview
    toggle.mutate({ postId, emoji }, { onSuccess: (data) => setLocal(data) });
    setOpen(false);
  }

  return (
    <div className="relative flex flex-wrap items-center gap-1.5">
      {local.map((r) => (
        <button
          key={r.emoji}
          type="button"
          onClick={() => react(r.emoji)}
          aria-pressed={r.reacted}
          aria-label={`${r.emoji} ${r.count}`}
          className={clsx(
            'flex h-9 items-center gap-1 rounded-full px-2.5 text-sm font-semibold transition-transform duration-fast active:scale-90',
            r.reacted
              ? 'bg-primary/15 text-primary ring-1 ring-primary/40'
              : dark
                ? 'bg-white/15 text-white'
                : 'bg-surface-muted text-text-secondary',
          )}
        >
          <span className="text-base leading-none">{r.emoji}</span>
          <span className="numeric">{r.count}</span>
        </button>
      ))}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Thêm cảm xúc"
        aria-expanded={open}
        className={clsx(
          'flex h-9 w-9 items-center justify-center rounded-full transition-transform duration-fast active:scale-90',
          open
            ? 'bg-primary/15 text-primary ring-1 ring-primary/40'
            : dark
              ? 'bg-white/15 text-white'
              : 'bg-surface-muted text-text-secondary',
        )}
      >
        <SmilePlus className="h-[1.15rem] w-[1.15rem]" />
      </button>

      {open && (
        <>
          {/* tap-away to close */}
          <button
            type="button"
            aria-hidden
            tabIndex={-1}
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div className="absolute bottom-full left-0 z-50 mb-2 flex gap-0.5 rounded-2xl bg-surface p-1.5 shadow-lift ring-1 ring-border animate-pop-in">
            {REACTION_EMOJIS.map((e) => {
              const mine = local.find((r) => r.emoji === e)?.reacted;
              return (
                <button
                  key={e}
                  type="button"
                  onClick={() => react(e)}
                  aria-label={e}
                  className={clsx(
                    'flex h-11 w-11 items-center justify-center rounded-xl text-2xl transition-transform duration-fast active:scale-90',
                    mine && 'bg-primary/15 ring-1 ring-primary/40',
                  )}
                >
                  {e}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
