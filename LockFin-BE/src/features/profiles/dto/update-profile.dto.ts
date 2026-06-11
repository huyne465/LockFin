import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength, ValidateIf } from 'class-validator';

export class UpdateProfileDto {
  @ApiProperty({ required: false, example: 'Huy Nguyễn' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  display_name?: string;

  @ApiProperty({ required: false, nullable: true, description: 'Đặt null để gỡ ảnh đại diện.' })
  @IsOptional()
  @ValidateIf((_o, v) => v !== null)
  @IsString()
  @MaxLength(2048)
  avatar_url?: string | null;
}
