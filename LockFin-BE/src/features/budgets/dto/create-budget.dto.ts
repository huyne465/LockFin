import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsPositive,
  IsUUID,
  Matches,
  ValidateIf,
} from 'class-validator';

export type BudgetPeriod = 'DAY' | 'MONTH' | 'YEAR';

export class CreateBudgetDto {
  @ApiProperty({
    required: false,
    nullable: true,
    description: 'Category to scope the budget to. Omit / null = ngân sách tổng (mọi khoản EXPENSE).',
  })
  @IsOptional()
  // Allow an explicit null (total budget); only validate UUID when a value is given.
  @ValidateIf((_o, v) => v !== null && v !== undefined)
  @IsUUID()
  category_id?: string | null;

  @ApiProperty({ enum: ['DAY', 'MONTH', 'YEAR'] })
  @IsEnum(['DAY', 'MONTH', 'YEAR'])
  period_type!: BudgetPeriod;

  @ApiProperty({ example: '2026-06-08', description: 'Bất kỳ ngày nào trong kỳ; BE tự chuẩn hoá về đầu kỳ.' })
  @Matches(/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/, { message: 'period_start must be YYYY-MM-DD' })
  period_start!: string;

  @ApiProperty({ example: 5000000 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  amount!: number;
}
