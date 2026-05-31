import { Injectable } from '@nestjs/common';
import { PostsRepository } from './posts.repository';
import { CreatePostDto } from './dto/create-post.dto';
import { ProfilesService } from '../profiles/profiles.service';

@Injectable()
export class PostsService {
  constructor(
    private readonly repo: PostsRepository,
    private readonly profiles: ProfilesService,
  ) {}

  async create(userId: string, dto: CreatePostDto) {
    const post = await this.repo.create(userId, dto);
    await this.profiles.updateStreak(userId);
    return post;
  }

  feed(limit?: number, offset?: number) {
    return this.repo.feed(limit, offset);
  }

  mine(userId: string, month?: string, limit?: number, offset?: number) {
    return this.repo.mine(userId, month, limit, offset);
  }

  stats(userId: string, month: string) {
    return this.repo.statsByCategory(userId, month);
  }
}
