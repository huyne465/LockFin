import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ReactionsRepository } from './reactions.repository';
import { FriendsRepository } from '../friends/friends.repository';
import { REACTION_EMOJIS, type ReactionSummary } from './reactions.constants';

@Injectable()
export class ReactionsService {
  constructor(
    private readonly repo: ReactionsRepository,
    private readonly friends: FriendsRepository,
  ) {}

  /**
   * Toggle the viewer's `emoji` reaction on a post. Only the author or an
   * accepted friend of the author may react. Returns the post's fresh summary.
   */
  async toggle(userId: string, postId: string, emoji: string): Promise<ReactionSummary[]> {
    const author = await this.repo.postAuthor(postId);
    if (!author) throw new NotFoundException('Post not found');

    if (author !== userId) {
      const friendIds = await this.friends.acceptedFriendIds(userId);
      if (!friendIds.includes(author)) {
        throw new ForbiddenException('Chỉ bạn bè mới react được bài này');
      }
    }

    if (await this.repo.exists(postId, userId, emoji)) {
      await this.repo.remove(postId, userId, emoji);
    } else {
      await this.repo.add(postId, userId, emoji);
    }

    return (await this.summaryFor(userId, [postId])).get(postId) ?? [];
  }

  /** Reaction summaries for a batch of posts, ordered by popularity. */
  async summaryFor(viewerId: string, postIds: string[]): Promise<Map<string, ReactionSummary[]>> {
    const rows = await this.repo.rawForPosts(postIds);

    // post_id → emoji → { count, reacted }
    const acc = new Map<string, Map<string, { count: number; reacted: boolean }>>();
    for (const r of rows) {
      const byEmoji = acc.get(r.post_id) ?? new Map();
      const cur = byEmoji.get(r.emoji) ?? { count: 0, reacted: false };
      cur.count += 1;
      if (r.user_id === viewerId) cur.reacted = true;
      byEmoji.set(r.emoji, cur);
      acc.set(r.post_id, byEmoji);
    }

    const rank = (e: string) => {
      const i = (REACTION_EMOJIS as readonly string[]).indexOf(e);
      return i === -1 ? REACTION_EMOJIS.length : i;
    };

    const out = new Map<string, ReactionSummary[]>();
    for (const [postId, byEmoji] of acc) {
      const list: ReactionSummary[] = [...byEmoji.entries()]
        .map(([emoji, v]) => ({ emoji, count: v.count, reacted: v.reacted }))
        .sort((a, b) => b.count - a.count || rank(a.emoji) - rank(b.emoji));
      out.set(postId, list);
    }
    return out;
  }
}
