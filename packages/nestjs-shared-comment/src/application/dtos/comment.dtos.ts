import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

const MAX_COMMENT_LENGTH = 10000;

export class MentionDto {
  @ApiProperty({ description: 'ID of the mentioned user' })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ description: 'Display name of the mentioned user' })
  @IsString()
  @IsNotEmpty()
  displayName: string;

  @ApiProperty({ description: 'Email of the mentioned user' })
  @IsEmail()
  email: string;
}

export class CreateCommentDto {
  @ApiProperty({ description: 'Comment content — may contain @[userId] tokens for client rendering' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(MAX_COMMENT_LENGTH)
  content: string;

  @ApiProperty({ description: 'The type of entity being commented on' })
  @IsString()
  @IsNotEmpty()
  entityType: string;

  @ApiProperty({ description: 'The ID of the entity being commented on' })
  @IsString()
  @IsNotEmpty()
  entityId: string;

  @ApiPropertyOptional({ description: 'Parent comment ID when posting a reply' })
  @IsString()
  @IsOptional()
  parentId?: string;

  @ApiProperty({
    description: 'Explicit list of users mentioned in the comment',
    type: [MentionDto],
    default: [],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MentionDto)
  mentions: MentionDto[];
}

export class UpdateCommentDto {
  @ApiProperty({ description: 'Updated comment content' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(MAX_COMMENT_LENGTH)
  content: string;

  @ApiProperty({
    description:
      'Full updated list of mentions — server diffs against existing ones to detect new @mentions',
    type: [MentionDto],
    default: [],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MentionDto)
  mentions: MentionDto[];
}

export class GetCommentsQueryDto {
  @ApiProperty({ description: 'The type of entity to fetch comments for' })
  @IsString()
  @IsNotEmpty()
  entityType: string;

  @ApiProperty({ description: 'The ID of the entity to fetch comments for' })
  @IsString()
  @IsNotEmpty()
  entityId: string;

  @ApiPropertyOptional({ description: 'Maximum number of root comments to return', default: 50, type: Number })
  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  limit?: number;

  @ApiPropertyOptional({ description: 'Number of root comments to skip (pagination)', default: 0, type: Number })
  @IsInt()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  offset?: number;
}

export class CommentMentionResponseDto {
  @ApiProperty()
  userId: string;

  @ApiProperty()
  displayName: string;
}

export class CommentResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  content: string;

  @ApiProperty()
  authorId: string;

  @ApiPropertyOptional()
  authorName?: string;

  @ApiProperty()
  entityType: string;

  @ApiProperty()
  entityId: string;

  @ApiPropertyOptional()
  parentId?: string;

  @ApiProperty({ type: () => [CommentResponseDto] })
  replies: CommentResponseDto[];

  @ApiProperty({ type: () => [CommentMentionResponseDto] })
  mentions: CommentMentionResponseDto[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class GetCommentsResponseDto {
  @ApiProperty({ description: 'Whether the caller is permitted to view comments for this entity' })
  hasAccess: boolean;

  @ApiPropertyOptional({ description: 'Machine-readable denial code when hasAccess is false' })
  reason?: string;

  @ApiPropertyOptional({ description: 'Human-readable denial message when hasAccess is false' })
  message?: string;

  @ApiProperty({ type: () => [CommentResponseDto] })
  comments: CommentResponseDto[];

  @ApiProperty({ description: 'Total number of root comments (before pagination)' })
  total: number;
}
