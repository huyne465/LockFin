import { Injectable } from '@nestjs/common';
import { PostsRepository } from './posts.repository';
import { CreatePostDto } from './dto/create-post.dto';
import { ProfilesService } from '../profiles/profiles.service';
import { FriendsRepository } from '../friends/friends.repository';
import { BudgetsService } from '../budgets/budgets.service';
import { AlbumsService } from '../albums/albums.service';
import { ReactionsService } from '../reactions/reactions.service';
import { OneSignalService } from '../notifications/onesignal.service';
import type { PostRow } from './posts.repository';

const PERIOD_LABEL: Record<string, string> = { DAY: 'ngày', MONTH: 'tháng', YEAR: 'năm' };

@Injectable()
export class PostsService {
  constructor(
    private readonly repo: PostsRepository,
    private readonly profiles: ProfilesService,
    private readonly friends: FriendsRepository,
    private readonly budgets: BudgetsService,
    private readonly albums: AlbumsService,
    private readonly reactions: ReactionsService,
    private readonly push: OneSignalService,
  ) {}

  /** Attach each viewer's reaction summary to a batch of posts. */
  private async withReactions(viewerId: string, posts: PostRow[]) {
    if (posts.length === 0) return [];
    const map = await this.reactions.summaryFor(viewerId, posts.map((p) => p.id));
    return posts.map((p) => ({ ...p, reactions: map.get(p.id) ?? [] }));
  }

  async create(userId: string, dto: CreatePostDto) {
    // Reject attaching a post to an album the caller doesn't own (404/403).
    if (dto.album_id) await this.albums.assertOwned(userId, dto.album_id);

    const post = await this.repo.create(userId, dto);
    await this.profiles.updateStreak(userId);
    // Attach a live budget snapshot so the client can warn immediately. Never
    // let a budget hiccup fail the post — fall back to no impact.
    let budget_impact: Awaited<ReturnType<BudgetsService['impactForPost']>> = [];
    try {
      budget_impact = await this.budgets.impactForPost(userId, post.created_at, post.category_id);
    } catch {
      budget_impact = [];
    }
    void this.notifyBudgetOverage(userId, budget_impact);
    return { ...post, budget_impact };
  }

  /** Alert the user when this post pushed one of their budgets over its limit. */
  private async notifyBudgetOverage(
    userId: string,
    impact: Awaited<ReturnType<BudgetsService['impactForPost']>>,
  ): Promise<void> {
    const over = impact.find((b) => b.is_over);
    if (!over) return;
    const period = PERIOD_LABEL[over.period_type] ?? 'kỳ này';
    await this.push.sendToUsers([userId], {
      title: 'Vượt ngân sách',
      body: `Bạn đã chi vượt ngân sách ${period} rồi. Cân nhắc lại nhé!`,
      url: '/budgets',
      data: { type: 'budget_over', budget_id: over.budget_id, period_type: over.period_type },
    });
  }

  /** Feed shows the user's own posts plus those of their accepted friends. */
  async feed(userId: string, limit?: number, offset?: number) {
    const friendIds = await this.friends.acceptedFriendIds(userId);
    const posts = await this.repo.feed([userId, ...friendIds], limit, offset);
    return this.withReactions(userId, posts);
  }

  async mine(userId: string, month?: string, limit?: number, offset?: number) {
    const posts = await this.repo.mine(userId, month, limit, offset);
    return this.withReactions(userId, posts);
  }

  stats(userId: string, month: string) {
    return this.repo.statsByCategory(userId, month);
  }
}
