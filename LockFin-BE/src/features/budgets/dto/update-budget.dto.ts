import { ApiProperty } from '@nestjs/swagger';
import {
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  ValidateIf,
} from 'class-validator';

export class UpdateBudgetDto {
  @ApiProperty({ required: false, example: 6000000 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  amount?: number;

  @ApiProperty({
    required: false,
    nullable: true,
    example: 'Cà phê công việc',
    description: 'Đổi tên ngân sách. Chuỗi rỗng/null ⇒ xoá tên (về hiển thị theo category).',
  })
  @IsOptional()
  @ValidateIf((_o, v) => v !== null && v !== undefined)
  @IsString()
  @MaxLength(60)
  name?: string | null;
}
