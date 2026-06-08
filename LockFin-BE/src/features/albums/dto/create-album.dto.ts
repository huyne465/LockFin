import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class CreateAlbumDto {
  @ApiProperty({ example: 'Đà Lạt 3N2Đ' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({ default: false, required: false })
  @IsOptional()
  @IsBoolean()
  is_public?: boolean;

  @ApiProperty({
    required: false,
    nullable: true,
    example: 8000000,
    description: 'Ngân sách cho cả chuyến. Omit / null = không đặt ngân sách.',
  })
  @IsOptional()
  @ValidateIf((_o, v) => v !== null && v !== undefined)
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  budget_amount?: number | null;

  @ApiProperty({ required: false, example: '2026-06-20' })
  @IsOptional()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/, { message: 'start_date must be YYYY-MM-DD' })
  start_date?: string;

  @ApiProperty({ required: false, example: '2026-06-22' })
  @IsOptional()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/, { message: 'end_date must be YYYY-MM-DD' })
  end_date?: string;

  @ApiProperty({
    required: false,
    type: [String],
    description: 'Gắn sẵn các post (của chính user) vào album khi tạo.',
  })
  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  post_ids?: string[];
}
