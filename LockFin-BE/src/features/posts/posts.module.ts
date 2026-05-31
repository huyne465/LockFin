import { Module } from '@nestjs/common';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';
import { PostsRepository } from './posts.repository';
import { ProfilesModule } from '../profiles/profiles.module';
import { FriendsModule } from '../friends/friends.module';

@Module({
  imports: [ProfilesModule, FriendsModule],
  controllers: [PostsController],
  providers: [PostsService, PostsRepository],
})
export class PostsModule {}
