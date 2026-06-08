import { Module } from '@nestjs/common';
import { AlbumsController } from './albums.controller';
import { AlbumsService } from './albums.service';
import { AlbumsRepository } from './albums.repository';

@Module({
  controllers: [AlbumsController],
  providers: [AlbumsService, AlbumsRepository],
  exports: [AlbumsService],
})
export class AlbumsModule {}
