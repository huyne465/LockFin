import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty()
  @IsString()
  @MaxLength(50)
  name!: string;

  @ApiProperty({ enum: ['EXPENSE', 'INCOME', 'SAVING', 'GOAL'] })
  @IsEnum(['EXPENSE', 'INCOME', 'SAVING', 'GOAL'])
  type!: 'EXPENSE' | 'INCOME' | 'SAVING' | 'GOAL';

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  icon?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  color_hex?: string;
}
