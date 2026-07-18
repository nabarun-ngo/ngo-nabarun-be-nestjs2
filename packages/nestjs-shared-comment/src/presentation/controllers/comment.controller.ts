import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { AuthUser, CurrentUser, UnifiedAuthGuard } from '@nabarun-ngo/nestjs-shared-auth';
import { ApiAutoResponse, ApiAutoVoidResponse } from '@nabarun-ngo/nestjs-shared-core';
import { AddCommentCommand } from '../../application/commands/add-comment/add-comment.command';
import { UpdateCommentCommand } from '../../application/commands/update-comment/update-comment.command';
import { DeleteCommentCommand } from '../../application/commands/delete-comment/delete-comment.command';
import { GetCommentsQuery } from '../../application/queries/get-comments/get-comments.query';
import {
  CommentResponseDto,
  CreateCommentDto,
  GetCommentsQueryDto,
  GetCommentsResponseDto,
  UpdateCommentDto,
} from '../../application/dtos/comment.dtos';

@ApiTags('Comments')
@ApiBearerAuth('jwt')
@UseGuards(UnifiedAuthGuard)
@Controller('comments')
export class CommentController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) { }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add a new comment or reply' })
  @ApiAutoResponse(CommentResponseDto, { status: 201 })
  addComment(
    @Body() dto: CreateCommentDto,
    @CurrentUser() user: AuthUser,
  ): Promise<CommentResponseDto> {
    const authorId = this.requireProfileId(user);

    return this.commandBus.execute(
      new AddCommentCommand({
        content: dto.content,
        entityType: dto.entityType,
        entityId: dto.entityId,
        parentId: dto.parentId,
        mentions: dto.mentions,
        authorId,
        authorName: user.name ?? '',
        authorEmail: user.email ?? '',
        userPermissions: user.permissions ?? [],
      }),
    );
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an existing comment' })
  @ApiAutoResponse(CommentResponseDto)
  updateComment(
    @Param('id') id: string,
    @Body() dto: UpdateCommentDto,
    @CurrentUser() user: AuthUser,
  ): Promise<CommentResponseDto> {
    const authorId = this.requireProfileId(user);

    return this.commandBus.execute(
      new UpdateCommentCommand({
        id,
        content: dto.content,
        mentions: dto.mentions,
        authorId,
        authorName: user.name ?? '',
        userPermissions: user.permissions ?? [],
      }),
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a comment and all its replies' })
  @ApiAutoVoidResponse({ status: 204 })
  deleteComment(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ): Promise<void> {
    const authorId = this.requireProfileId(user);

    return this.commandBus.execute(
      new DeleteCommentCommand({
        id,
        authorId,
        userPermissions: user.permissions ?? [],
      }),
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get comments for an entity' })
  @ApiAutoResponse(GetCommentsResponseDto)
  getComments(
    @Query() query: GetCommentsQueryDto,
    @CurrentUser() user: AuthUser,
  ): Promise<GetCommentsResponseDto> {
    const userId = this.requireProfileId(user);

    return this.queryBus.execute(
      new GetCommentsQuery({
        entityType: query.entityType,
        entityId: query.entityId,
        userId,
        userPermissions: user.permissions ?? [],
        limit: query.limit,
        offset: query.offset,
      }),
    );
  }

  private requireProfileId(user: AuthUser): string {
    if (!user.userId) {
      throw new UnauthorizedException('User profile not found');
    }
    return user.userId;
  }
}
