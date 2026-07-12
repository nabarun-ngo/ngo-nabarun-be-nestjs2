import { IsOptional, IsString, IsEnum, IsBoolean, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { PaginatedQueryDto } from 'nestjs-shared/core';
import { UserStatus } from '../../domain/enums/user-status.enum';

const USER_SORT_FIELDS = ['firstName', 'lastName', 'email', 'status', 'createdAt', 'updatedAt'] as const;

export class ListUsersQueryDto extends PaginatedQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ enum: UserStatus })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isPublic?: boolean;

  @ApiPropertyOptional({ enum: USER_SORT_FIELDS })
  @IsOptional()
  @IsIn(USER_SORT_FIELDS)
  declare sortBy?: string;
}
