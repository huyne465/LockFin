import { ApiProperty } from '@nestjs/swagger';
import { Matches } from 'class-validator';

export class StatsQueryDto {
  @ApiProperty({ example: '2026-05', description: 'YYYY-MM' })
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, { message: 'month must be YYYY-MM' })
  month!: string;
}
