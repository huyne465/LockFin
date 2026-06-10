import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';
import { REACTION_EMOJIS } from '../reactions.constants';

export class ReactDto {
  @ApiProperty({ enum: REACTION_EMOJIS, description: 'Emoji react, toggle nếu đã có.' })
  @IsIn(REACTION_EMOJIS as unknown as string[])
  emoji!: string;
}
