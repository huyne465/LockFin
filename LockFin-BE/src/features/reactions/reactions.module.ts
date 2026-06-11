import { Module } from '@nestjs/common';
import { ReactionsController } from './reactions.controller';
import { ReactionsService } from './reactions.service';
import { ReactionsRepository } from './reactions.repository';
import { FriendsModule } from '../friends/friends.module';
import { ProfilesModule } from '../profiles/profiles.module';

@Module({
  imports: [FriendsModule, ProfilesModule], // FriendsRepository (friendship check) + ProfilesService (reactor name)
  controllers: [ReactionsController],
  providers: [ReactionsService, ReactionsRepository],
  exports: [ReactionsService], // PostsService enriches feed/mine with reactions
})
export class ReactionsModule {}
