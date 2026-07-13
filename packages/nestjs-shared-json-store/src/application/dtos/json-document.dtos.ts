import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';

// ── Request DTOs ────────────────────────────────────────────────────────────

export class CreateJsonDocumentDto {
  @ApiProperty({ description: 'Slug-style key, unique within a namespace', example: 'welcome-email' })
  @IsString()
  @IsNotEmpty()
  key: string;

  @ApiProperty({ description: 'Consumer namespace, e.g. "correspondence"', example: 'correspondence' })
  @IsString()
  @IsNotEmpty()
  namespace: string;

  @ApiProperty({ description: 'Arbitrary JSON payload', example: { subject: 'Welcome!' } })
  @IsObject()
  payload: Record<string, unknown>;
}

export class UpdateJsonDocumentDto {
  @ApiProperty({ description: 'Replacement JSON payload', example: { subject: 'Welcome back!' } })
  @IsObject()
  payload: Record<string, unknown>;
}

export class UpsertJsonDocumentDto {
  @ApiProperty({ description: 'Slug-style key, unique within a namespace', example: 'welcome-email' })
  @IsString()
  @IsNotEmpty()
  key: string;

  @ApiProperty({ description: 'Consumer namespace, e.g. "correspondence"', example: 'correspondence' })
  @IsString()
  @IsNotEmpty()
  namespace: string;

  @ApiProperty({ description: 'Arbitrary JSON payload', example: { subject: 'Welcome!' } })
  @IsObject()
  payload: Record<string, unknown>;
}

export class ListJsonDocumentsQueryDto {
  @ApiPropertyOptional({ description: 'Filter by namespace', example: 'correspondence' })
  @IsString()
  @IsOptional()
  namespace?: string;
}

// ── Response DTO ─────────────────────────────────────────────────────────────

export class JsonDocumentResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ example: 'welcome-email' })
  key: string;

  @ApiProperty({ example: 'correspondence' })
  namespace: string;

  @ApiProperty({ description: 'Stored JSON payload' })
  payload: Record<string, unknown>;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
