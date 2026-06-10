import { Body, Controller, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ReactionsService } from './reactions.service';
import { ReactDto } from './dto/react.dto';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';

@ApiTags('reactions')
@ApiBearerAuth()
@Controller('posts')
export class ReactionsController {
  constructor(private readonly service: ReactionsService) {}

  /** Toggle a reaction on a post. Returns the post's fresh reaction summary. */
  @Post(':id/reactions')
  toggle(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReactDto,
  ) {
    return this.service.toggle(user.id, id, dto.emoji);
  }
}
