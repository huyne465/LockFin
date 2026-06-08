import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsUUID } from 'class-validator';

export class AddPostsDto {
  @ApiProperty({ type: [String], description: 'Post ids (của chính user) cần gắn vào album.' })
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('all', { each: true })
  post_ids!: string[];
}
