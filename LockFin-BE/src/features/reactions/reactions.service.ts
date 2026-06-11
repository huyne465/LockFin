import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ReactionsRepository } from './reactions.repository';
import { FriendsRepository } from '../friends/friends.repository';
import { ProfilesService } from '../profiles/profiles.service';
import { OneSignalService } from '../notifications/onesignal.service';
import { REACTION_EMOJIS, type ReactionSummary } from './reactions.constants';

@Injectable()
export class ReactionsService {
  constructor(
    private readonly repo: ReactionsRepository,
    private readonly friends: FriendsRepository,
    private readonly profiles: ProfilesService,
    private readonly push: OneSignalService,
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
      // Notify the author when someone else reacts (not on un-react / self-react).
      if (author !== userId) void this.notifyAuthor(author, userId, emoji);
    }

    return (await this.summaryFor(userId, [postId])).get(postId) ?? [];
  }

  /** Fire-and-forget push to a post author when a friend reacts. */
  private async notifyAuthor(authorId: string, reactorId: string, emoji: string): Promise<void> {
    const reactor = await this.profiles.getPublicProfile(reactorId).catch(() => null);
    const name = reactor?.display_name || reactor?.username || 'Một người bạn';
    await this.push.sendToUsers([authorId], {
      title: 'Tương tác mới',
      body: `${name} đã thả ${emoji} vào bài của bạn`,
      url: '/feed',
      data: { type: 'reaction', reactor_id: reactorId },
    });
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
