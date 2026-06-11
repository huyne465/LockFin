import { Module } from '@nestjs/common';
import { FriendsController } from './friends.controller';
import { FriendsService } from './friends.service';
import { FriendsRepository } from './friends.repository';
import { ProfilesModule } from '../profiles/profiles.module';

@Module({
  imports: [ProfilesModule], // ProfilesService for notification copy
  controllers: [FriendsController],
  providers: [FriendsService, FriendsRepository],
  exports: [FriendsRepository],
})
export class FriendsModule {}
