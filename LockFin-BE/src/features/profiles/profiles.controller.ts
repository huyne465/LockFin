import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ProfilesService } from './profiles.service';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';

@ApiTags('profiles')
@ApiBearerAuth()
@Controller('profiles')
export class ProfilesController {
  constructor(private readonly service: ProfilesService) {}

  @Get('me')
  getMe(@CurrentUser() user: AuthUser) {
    return this.service.getProfile(user.id);
  }

  /** Search other users by username/display_name to send a friend request. */
  @Get('search')
  @ApiQuery({ name: 'q', required: false })
  search(@CurrentUser() user: AuthUser, @Query('q') q?: string) {
    return this.service.searchProfiles(user.id, q ?? '');
  }
}
