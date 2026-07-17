import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsDate, IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ProjectCategory, ProjectPhase, ProjectStatus } from '../../domain/enums/project.enum';
import { KeyValueOption } from '../ports/project-reference-data.port';

export class CreateProjectDto {
  @IsString() @ApiProperty() name!: string;
  @IsString() @ApiProperty() description!: string;
  @IsString() @ApiProperty() code!: string;
  @IsEnum(ProjectCategory) @ApiProperty({ enum: ProjectCategory }) category!: ProjectCategory;
  @IsOptional() @IsEnum(ProjectStatus) @ApiPropertyOptional({ enum: ProjectStatus }) status?: ProjectStatus;
  @IsOptional() @IsEnum(ProjectPhase) @ApiPropertyOptional({ enum: ProjectPhase }) phase?: ProjectPhase;
  @IsDate() @Type(() => Date) @ApiProperty() startDate!: Date;
  @IsOptional() @IsDate() @Type(() => Date) @ApiPropertyOptional() endDate?: Date;
  @IsNumber() @Min(0.01) @ApiProperty() budget!: number;
  @IsString() @ApiProperty() currency!: string;
  @IsOptional() @IsString() @ApiPropertyOptional() location?: string;
  @IsOptional() @IsNumber() @Min(0) @ApiPropertyOptional() targetBeneficiaryCount?: number;
  @IsString() @ApiProperty() managerId!: string;
  @IsOptional() @IsString() @ApiPropertyOptional() sponsorId?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) @ApiPropertyOptional({ type: [String] }) tags?: string[];
  @IsOptional() @ApiPropertyOptional() metadata?: Record<string, unknown>;
}

export class UpdateProjectDto {
  @IsOptional() @IsString() @ApiPropertyOptional() name?: string;
  @IsOptional() @IsString() @ApiPropertyOptional() description?: string;
  @IsOptional() @IsEnum(ProjectCategory) @ApiPropertyOptional({ enum: ProjectCategory }) category?: ProjectCategory;
  @IsOptional() @IsEnum(ProjectStatus) @ApiPropertyOptional({ enum: ProjectStatus }) status?: ProjectStatus;
  @IsOptional() @IsEnum(ProjectPhase) @ApiPropertyOptional({ enum: ProjectPhase }) phase?: ProjectPhase;
  @IsOptional() @IsDate() @Type(() => Date) @ApiPropertyOptional() endDate?: Date;
  @IsOptional() @IsNumber() @Min(0.01) @ApiPropertyOptional() budget?: number;
  @IsOptional() @IsString() @ApiPropertyOptional() location?: string;
  @IsOptional() @IsNumber() @Min(0) @ApiPropertyOptional() targetBeneficiaryCount?: number;
  @IsOptional() @IsString() @ApiPropertyOptional() sponsorId?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) @ApiPropertyOptional({ type: [String] }) tags?: string[];
  @IsOptional() @ApiPropertyOptional() metadata?: Record<string, unknown>;
}

export class ProjectDetailDto {
  @ApiProperty() id!: string;
  @ApiProperty() name!: string;
  @ApiProperty() description!: string;
  @ApiProperty() code!: string;
  @ApiProperty({ enum: ProjectCategory }) category!: ProjectCategory;
  @ApiProperty({ enum: ProjectStatus }) status!: ProjectStatus;
  @ApiProperty({ enum: ProjectPhase }) phase!: ProjectPhase;
  @ApiProperty() startDate!: Date;
  @ApiPropertyOptional() endDate?: Date;
  @ApiPropertyOptional() actualEndDate?: Date;
  @ApiProperty() budget!: number;
  @ApiProperty() spentAmount!: number;
  @ApiProperty() currency!: string;
  @ApiPropertyOptional() location?: string;
  @ApiPropertyOptional() targetBeneficiaryCount?: number;
  @ApiPropertyOptional() actualBeneficiaryCount?: number;
  @ApiProperty() managerId!: string;
  @ApiPropertyOptional() sponsorId?: string;
  @ApiProperty({ type: [String] }) tags!: string[];
  @ApiPropertyOptional() metadata?: Record<string, unknown>;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
  @ApiProperty({ enum: ProjectStatus, isArray: true }) nextStatus!: ProjectStatus[];
}

export class ProjectDetailFilterDto {
  @ApiPropertyOptional({ enum: ProjectStatus }) status?: ProjectStatus;
  @ApiPropertyOptional({ enum: ProjectCategory }) category?: ProjectCategory;
  @ApiPropertyOptional({ enum: ProjectPhase }) phase?: ProjectPhase;
  @ApiPropertyOptional() managerId?: string;
  @ApiPropertyOptional() sponsorId?: string;
  @ApiPropertyOptional() location?: string;
  @ApiPropertyOptional({ type: [String] }) tags?: string[];
}

export class ProjectRefDataDto {
  @ApiProperty({ isArray: true }) projectCategories!: KeyValueOption[];
  @ApiProperty({ isArray: true }) projectStatuses!: KeyValueOption[];
  @ApiProperty({ isArray: true }) projectPhases!: KeyValueOption[];
  @ApiProperty({ isArray: true }) activityScales!: KeyValueOption[];
  @ApiProperty({ isArray: true }) activityTypes!: KeyValueOption[];
  @ApiProperty({ isArray: true }) activityStatuses!: KeyValueOption[];
  @ApiProperty({ isArray: true }) activityPriorities!: KeyValueOption[];
}
