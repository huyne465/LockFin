import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class UpdateAlbumDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name?: string;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @ValidateIf((_o, v) => v !== null)
  @IsString()
  @MaxLength(1000)
  description?: string | null;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  is_public?: boolean;

  @ApiProperty({
    required: false,
    nullable: true,
    description: 'Đặt null để bỏ ngân sách.',
  })
  @IsOptional()
  @ValidateIf((_o, v) => v !== null)
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  budget_amount?: number | null;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @ValidateIf((_o, v) => v !== null)
  @IsString()
  cover_photo_url?: string | null;

  @ApiProperty({ required: false, nullable: true, example: '2026-06-20' })
  @IsOptional()
  @ValidateIf((_o, v) => v !== null)
  @Matches(/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/, { message: 'start_date must be YYYY-MM-DD' })
  start_date?: string | null;

  @ApiProperty({ required: false, nullable: true, example: '2026-06-22' })
  @IsOptional()
  @ValidateIf((_o, v) => v !== null)
  @Matches(/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/, { message: 'end_date must be YYYY-MM-DD' })
  end_date?: string | null;
}
