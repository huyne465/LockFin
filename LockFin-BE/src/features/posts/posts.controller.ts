import { Body, Controller, DefaultValuePipe, Get, ParseIntPipe, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { StatsQueryDto } from './dto/stats-query.dto';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';

@ApiTags('posts')
@ApiBearerAuth()
@Controller('posts')
export class PostsController {
  constructor(private readonly service: PostsService) {}

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreatePostDto) {
    return this.service.create(user.id, dto);
  }

  @Get('feed')
  feed(
    @CurrentUser() user: AuthUser,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number,
  ) {
    return this.service.feed(user.id, limit, offset);
  }

  @Get('mine')
  mine(
    @CurrentUser() user: AuthUser,
    @Query('month') month: string | undefined,
    @Query('limit', new DefaultValuePipe(200), ParseIntPipe) limit: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number,
  ) {
    return this.service.mine(user.id, month, limit, offset);
  }

  @Get('stats')
  stats(@CurrentUser() user: AuthUser, @Query() q: StatsQueryDto) {
    return this.service.stats(user.id, q.month);
  }
}
