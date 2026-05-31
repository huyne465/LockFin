import { Module } from '@nestjs/common';
import { FriendsController } from './friends.controller';
import { FriendsService } from './friends.service';
import { FriendsRepository } from './friends.repository';

@Module({
  controllers: [FriendsController],
  providers: [FriendsService, FriendsRepository],
  exports: [FriendsRepository],
})
export class FriendsModule {}
