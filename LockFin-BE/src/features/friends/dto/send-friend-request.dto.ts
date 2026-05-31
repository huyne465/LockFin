import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class SendFriendRequestDto {
  @ApiProperty({ description: 'Profile id of the user to befriend.' })
  @IsUUID()
  receiver_id!: string;
}
