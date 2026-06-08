import { Injectable } from '@nestjs/common';
import { PostsRepository } from './posts.repository';
import { CreatePostDto } from './dto/create-post.dto';
import { ProfilesService } from '../profiles/profiles.service';
import { FriendsRepository } from '../friends/friends.repository';
import { BudgetsService } from '../budgets/budgets.service';

@Injectable()
export class PostsService {
  constructor(
    private readonly repo: PostsRepository,
    private readonly profiles: ProfilesService,
    private readonly friends: FriendsRepository,
    private readonly budgets: BudgetsService,
  ) {}

  async create(userId: string, dto: CreatePostDto) {
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
    return { ...post, budget_impact };
  }

  /** Feed shows the user's own posts plus those of their accepted friends. */
  async feed(userId: string, limit?: number, offset?: number) {
    const friendIds = await this.friends.acceptedFriendIds(userId);
    return this.repo.feed([userId, ...friendIds], limit, offset);
  }

  mine(userId: string, month?: string, limit?: number, offset?: number) {
    return this.repo.mine(userId, month, limit, offset);
  }

  stats(userId: string, month: string) {
    return this.repo.statsByCategory(userId, month);
  }
}
