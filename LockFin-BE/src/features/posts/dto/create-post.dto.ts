import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreatePostDto {
  @ApiProperty()
  @IsUUID()
  category_id!: string;

  @ApiProperty()
  @IsString()
  photo_url!: string;

  @ApiProperty()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  amount!: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;

  @ApiProperty({ default: false })
  @IsOptional()
  @IsBoolean()
  is_private?: boolean;
}
