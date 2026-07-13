import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AccessGatedResponse } from '@ce/nestjs-shared-core';

export class DocumentMappingDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  entityType: string;

  @ApiProperty()
  entityId: string;
}

export class DocumentResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  fileName: string;

  @ApiProperty()
  contentType: string;

  @ApiProperty()
  fileSize: number;

  /** DocumentVisibility value: 'PUBLIC' | 'PRIVATE' */
  @ApiProperty()
  visibility: string;

  @ApiPropertyOptional()
  uploadedById?: string;

  @ApiProperty({ type: [DocumentMappingDto] })
  mappings: DocumentMappingDto[];

  @ApiProperty()
  uploadedAt: Date;

  @ApiPropertyOptional()
  updatedAt?: Date;

  @ApiPropertyOptional()
  deletedAt?: Date;
}

export class ListDocumentsResponseDto extends AccessGatedResponse<DocumentResponseDto> {
  @ApiProperty({ type: [DocumentResponseDto] })
  declare data: DocumentResponseDto[];
}
