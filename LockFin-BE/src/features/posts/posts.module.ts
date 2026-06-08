import { Module } from '@nestjs/common';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';
import { PostsRepository } from './posts.repository';
import { ProfilesModule } from '../profiles/profiles.module';
import { FriendsModule } from '../friends/friends.module';
import { BudgetsModule } from '../budgets/budgets.module';
import { AlbumsModule } from '../albums/albums.module';

@Module({
  imports: [ProfilesModule, FriendsModule, BudgetsModule, AlbumsModule],
  controllers: [PostsController],
  providers: [PostsService, PostsRepository],
})
export class PostsModule {}
