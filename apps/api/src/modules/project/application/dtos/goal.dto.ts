import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDate, IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { GoalPriority, GoalStatus } from '../../domain/enums/goal.enum';
export class CreateGoalDto {
  @IsString() @ApiProperty() title: string;
  @IsEnum(GoalPriority) @ApiProperty({ enum: GoalPriority }) priority: GoalPriority;
  @IsOptional() @IsString() @ApiPropertyOptional() description?: string;
  @IsOptional() @IsNumber() @Min(0) @ApiPropertyOptional() targetValue?: number;
  @IsOptional() @IsString() @ApiPropertyOptional() targetUnit?: string;
  @IsOptional() @IsDate() @Type(() => Date) @ApiPropertyOptional() deadline?: Date;
  @IsOptional() @IsNumber() @Min(0) @ApiPropertyOptional() weight?: number;
}
export class UpdateGoalDto { @IsOptional() @IsString() title?: string; @IsOptional() @IsString() description?: string; @IsOptional() @IsNumber() @Min(0) targetValue?: number; @IsOptional() @IsEnum(GoalPriority) priority?: GoalPriority; }
export class UpdateGoalProgressDto { @IsNumber() @Min(0) @ApiProperty() currentValue: number; }
export class GoalDetailDto { @ApiProperty() id: string; @ApiProperty() projectId: string; @ApiProperty() title: string; @ApiProperty() priority: GoalPriority; @ApiProperty() status: GoalStatus; @ApiProperty() currentValue: number; @ApiPropertyOptional() targetValue?: number; @ApiPropertyOptional() description?: string; }
export class GoalListResponseDto { @ApiProperty({ type: [GoalDetailDto] }) items: GoalDetailDto[]; @ApiProperty() total: number; @ApiProperty() pageIndex: number; @ApiProperty() pageSize: number; }
