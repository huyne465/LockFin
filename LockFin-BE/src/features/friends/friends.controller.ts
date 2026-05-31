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
import { FriendsService } from './friends.service';
import { SendFriendRequestDto } from './dto/send-friend-request.dto';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';

@ApiTags('friends')
@ApiBearerAuth()
@Controller('friends')
export class FriendsController {
  constructor(private readonly service: FriendsService) {}

  /** Accepted friends of the signed-in user. */
  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.service.listFriends(user.id);
  }

  /** Pending requests addressed to the signed-in user. */
  @Get('requests/incoming')
  incoming(@CurrentUser() user: AuthUser) {
    return this.service.listIncoming(user.id);
  }

  /** Pending requests the signed-in user has sent. */
  @Get('requests/outgoing')
  outgoing(@CurrentUser() user: AuthUser) {
    return this.service.listOutgoing(user.id);
  }

  @Post('requests')
  send(@CurrentUser() user: AuthUser, @Body() dto: SendFriendRequestDto) {
    return this.service.sendRequest(user.id, dto.receiver_id);
  }

  @Patch(':id/accept')
  accept(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.accept(user.id, id);
  }

  /** Decline an incoming request, cancel a sent one, or unfriend. */
  @Delete(':id')
  @HttpCode(204)
  remove(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(user.id, id);
  }
}
