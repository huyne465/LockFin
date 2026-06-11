import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ProfilesService } from './profiles.service';
import { AlbumsService } from '../albums/albums.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';

@ApiTags('profiles')
@ApiBearerAuth()
@Controller('profiles')
export class ProfilesController {
  constructor(
    private readonly service: ProfilesService,
    private readonly albums: AlbumsService,
  ) {}

  @Get('me')
  getMe(@CurrentUser() user: AuthUser) {
    return this.service.getProfile(user.id);
  }

  /** Update the signed-in user's display name / avatar. Username is immutable. */
  @Patch('me')
  updateMe(@CurrentUser() user: AuthUser, @Body() dto: UpdateProfileDto) {
    return this.service.updateProfile(user.id, dto);
  }

  /** Search other users by username/display_name to send a friend request. */
  @Get('search')
  @ApiQuery({ name: 'q', required: false })
  search(@CurrentUser() user: AuthUser, @Query('q') q?: string) {
    return this.service.searchProfiles(user.id, q ?? '');
  }

  /** Another user's public profile (name/avatar/username). */
  @Get(':userId')
  publicProfile(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.service.getPublicProfile(userId);
  }

  /** Another user's public albums (for viewing their profile). */
  @Get(':userId/albums')
  publicAlbums(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.albums.publicAlbumsOf(userId);
  }
}
