import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, Matches } from 'class-validator';
import type { BudgetPeriod } from './create-budget.dto';

export class BudgetQueryDto {
  @ApiPropertyOptional({ example: '2026-06-08', description: 'YYYY-MM-DD. Mặc định = hôm nay.' })
  @IsOptional()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/, { message: 'date must be YYYY-MM-DD' })
  date?: string;

  @ApiPropertyOptional({ enum: ['DAY', 'MONTH', 'YEAR'] })
  @IsOptional()
  @IsEnum(['DAY', 'MONTH', 'YEAR'])
  period_type?: BudgetPeriod;
}
