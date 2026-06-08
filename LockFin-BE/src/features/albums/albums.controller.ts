import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AlbumsService } from './albums.service';
import { CreateAlbumDto } from './dto/create-album.dto';
import { UpdateAlbumDto } from './dto/update-album.dto';
import { AddPostsDto } from './dto/add-posts.dto';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';

@ApiTags('albums')
@ApiBearerAuth()
@Controller('albums')
export class AlbumsController {
  constructor(private readonly service: AlbumsService) {}

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateAlbumDto) {
    return this.service.create(user.id, dto);
  }

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.service.list(user.id);
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(user.id, id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAlbumDto,
  ) {
    return this.service.update(user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(user.id, id);
  }

  @Post(':id/posts')
  addPosts(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddPostsDto,
  ) {
    return this.service.addPosts(user.id, id, dto.post_ids);
  }

  @Delete(':id/posts/:postId')
  removePost(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('postId', ParseUUIDPipe) postId: string,
  ) {
    return this.service.removePost(user.id, id, postId);
  }
}
