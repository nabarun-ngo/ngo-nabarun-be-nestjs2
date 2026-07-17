import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDate, IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { BeneficiaryGender, BeneficiaryStatus, BeneficiaryType } from '../../domain/enums/beneficiary.enum';

export class CreateBeneficiaryDto {
  @IsString() @ApiProperty() name: string;
  @IsEnum(BeneficiaryType) @ApiProperty({ enum: BeneficiaryType }) type: BeneficiaryType;
  @IsDate() @Type(() => Date) @ApiProperty() enrollmentDate: Date;
  @IsOptional() @IsEnum(BeneficiaryGender) @ApiPropertyOptional({ enum: BeneficiaryGender }) gender?: BeneficiaryGender;
  @IsOptional() @IsNumber() @Min(0) @ApiPropertyOptional() age?: number;
  @IsOptional() @IsDate() @Type(() => Date) @ApiPropertyOptional() dateOfBirth?: Date;
  @IsOptional() @IsString() @ApiPropertyOptional() contactNumber?: string;
  @IsOptional() @IsString() @ApiPropertyOptional() email?: string;
  @IsOptional() @IsString() @ApiPropertyOptional() address?: string;
  @IsOptional() @IsString() @ApiPropertyOptional() location?: string;
  @IsOptional() @IsString() @ApiPropertyOptional() category?: string;
  @IsOptional() @ApiPropertyOptional() benefitsReceived?: string[];
  @IsOptional() @ApiPropertyOptional() notes?: string;
  @IsOptional() @ApiPropertyOptional() metadata?: Record<string, unknown>;
}

export class UpdateBeneficiaryDto {
  @IsOptional() @IsString() @ApiPropertyOptional() name?: string;
  @IsOptional() @IsEnum(BeneficiaryType) @ApiPropertyOptional({ enum: BeneficiaryType }) type?: BeneficiaryType;
  @IsOptional() @IsEnum(BeneficiaryGender) @ApiPropertyOptional({ enum: BeneficiaryGender }) gender?: BeneficiaryGender;
  @IsOptional() @IsNumber() @Min(0) @ApiPropertyOptional() age?: number;
  @IsOptional() @IsString() @ApiPropertyOptional() contactNumber?: string;
  @IsOptional() @IsString() @ApiPropertyOptional() email?: string;
  @IsOptional() @IsString() @ApiPropertyOptional() address?: string;
  @IsOptional() @IsString() @ApiPropertyOptional() location?: string;
  @IsOptional() @IsString() @ApiPropertyOptional() category?: string;
  @IsOptional() @ApiPropertyOptional() benefitsReceived?: string[];
  @IsOptional() @ApiPropertyOptional() notes?: string;
}

export class BeneficiaryDetailFilterDto {
  @IsOptional() @IsEnum(BeneficiaryStatus) @ApiPropertyOptional({ enum: BeneficiaryStatus }) status?: BeneficiaryStatus;
  @IsOptional() @IsEnum(BeneficiaryType) @ApiPropertyOptional({ enum: BeneficiaryType }) type?: BeneficiaryType;
  @IsOptional() @IsString() @ApiPropertyOptional() category?: string;
}

export class BeneficiaryDetailDto {
  @ApiProperty() id: string;
  @ApiProperty() projectId: string;
  @ApiProperty() name: string;
  @ApiProperty({ enum: BeneficiaryType }) type: BeneficiaryType;
  @ApiPropertyOptional({ enum: BeneficiaryGender }) gender?: BeneficiaryGender;
  @ApiPropertyOptional() age?: number;
  @ApiPropertyOptional() dateOfBirth?: Date;
  @ApiPropertyOptional() contactNumber?: string;
  @ApiPropertyOptional() email?: string;
  @ApiPropertyOptional() address?: string;
  @ApiPropertyOptional() location?: string;
  @ApiPropertyOptional() category?: string;
  @ApiProperty() enrollmentDate: Date;
  @ApiPropertyOptional() exitDate?: Date;
  @ApiProperty({ enum: BeneficiaryStatus }) status: BeneficiaryStatus;
  @ApiProperty({ type: [String] }) benefitsReceived: string[];
  @ApiPropertyOptional() notes?: string;
  @ApiPropertyOptional() metadata?: Record<string, unknown>;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
}

export class BeneficiaryListResponseDto {
  @ApiProperty({ type: [BeneficiaryDetailDto] }) items: BeneficiaryDetailDto[];
  @ApiProperty() total: number;
  @ApiProperty() pageIndex: number;
  @ApiProperty() pageSize: number;
}
