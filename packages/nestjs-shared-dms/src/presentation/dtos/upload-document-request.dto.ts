import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBase64,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { DocumentVisibility } from '../../domain/enums/document-visibility.enum';

export class DocumentMappingRequestDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  entityType: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  entityId: string;
}

export class UploadDocumentRequestDto {
  @ApiProperty({ description: 'Base64-encoded file content' })
  @IsNotEmpty()
  @IsBase64()
  fileBase64: string;

  @ApiProperty({ description: 'Original file name, e.g. report.pdf' })
  @IsNotEmpty()
  @IsString()
  fileName: string;

  @ApiProperty({ description: 'MIME type, e.g. application/pdf' })
  @IsNotEmpty()
  @IsString()
  contentType: string;

  @ApiProperty({ type: [DocumentMappingRequestDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DocumentMappingRequestDto)
  mappings: DocumentMappingRequestDto[];

  @ApiPropertyOptional({ enum: DocumentVisibility, default: DocumentVisibility.Private })
  @IsOptional()
  @IsEnum(DocumentVisibility)
  visibility?: DocumentVisibility;
}
