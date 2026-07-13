import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsDateString, IsOptional, IsString, MinLength } from 'class-validator';

export class GenerateApiKeyRequestDto {
  @ApiProperty({ example: 'My Service Key' })
  @IsString()
  @MinLength(1)
  name: string;

  @ApiProperty({ example: ['read:data', 'write:data'], type: [String] })
  @IsArray()
  @IsString({ each: true })
  permissions: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  ownerId?: string;
}

export class UpdateApiKeyPermissionsRequestDto {
  @ApiProperty({ example: ['read:data'], type: [String] })
  @IsArray()
  @IsString({ each: true })
  permissions: string[];
}

export class GrantRoleRequestDto {
  @ApiProperty({ example: 'admin' })
  @IsString()
  @MinLength(1)
  roleKey: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  ownerId?: string;

  @ApiProperty({ required: false, example: 'proj-A' })
  @IsOptional()
  @IsString()
  entityId?: string;

  @ApiProperty({ required: false, example: 'project' })
  @IsOptional()
  @IsString()
  entityType?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  note?: string;
}

export class AddToGroupRequestDto {
  @ApiProperty({ example: 'platform-admins' })
  @IsString()
  @MinLength(1)
  groupKey: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  ownerId?: string;

  @ApiProperty({ required: false, example: 'proj-A' })
  @IsOptional()
  @IsString()
  entityId?: string;

  @ApiProperty({ required: false, example: 'project' })
  @IsOptional()
  @IsString()
  entityType?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  note?: string;
}
