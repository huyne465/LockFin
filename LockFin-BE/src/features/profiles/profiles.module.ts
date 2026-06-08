import { Module } from '@nestjs/common';
import { ProfilesController } from './profiles.controller';
import { ProfilesService } from './profiles.service';
import { ProfilesRepository } from './profiles.repository';
import { AlbumsModule } from '../albums/albums.module';

@Module({
  imports: [AlbumsModule],
  controllers: [ProfilesController],
  providers: [ProfilesService, ProfilesRepository],
  exports: [ProfilesService],
})
export class ProfilesModule {}
