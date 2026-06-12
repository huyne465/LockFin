import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  MaxLength,
  ValidateIf,
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

  @ApiProperty({
    required: false,
    nullable: true,
    description: 'Có giá trị ⇒ post vào album đó; omit/null ⇒ lên pool.',
  })
  @IsOptional()
  @ValidateIf((_o, v) => v !== null && v !== undefined)
  @IsUUID()
  album_id?: string | null;

  @ApiProperty({
    required: false,
    type: [String],
    description:
      'Budget IDs khoản này KHÔNG tính vào (user bỏ theo dõi ở các mức đó). Bỏ trống ⇒ tính vào mọi budget phủ category + thời gian.',
  })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsUUID('all', { each: true })
  excluded_budget_ids?: string[];
}
