import { DynamicModule, Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { Comment2ModuleOptions } from './comment.schema';
import { COMMENT2_OPTIONS } from './infrastructure/comment-options.token';

import { AddCommentHandler } from './application/commands/add-comment/add-comment.handler';
import { UpdateCommentHandler } from './application/commands/update-comment/update-comment.handler';
import { DeleteCommentHandler } from './application/commands/delete-comment/delete-comment.handler';

import { GetCommentsHandler } from './application/queries/get-comments/get-comments.handler';

import { OnCommentAddedHandler } from './application/event-handlers/on-comment-added/on-comment-added.handler';
import { OnCommentUpdatedHandler } from './application/event-handlers/on-comment-updated/on-comment-updated.handler';
import { OnCommentMentionedHandler } from './application/event-handlers/on-comment-mentioned/on-comment-mentioned.handler';
import { OnCommentAddedSubscriberHandler } from './application/event-handlers/on-comment-added-subscriber/on-comment-added-subscriber.handler';

import { CommentController } from './presentation/controllers/comment.controller';

const COMMAND_HANDLERS = [AddCommentHandler, UpdateCommentHandler, DeleteCommentHandler];

const QUERY_HANDLERS = [GetCommentsHandler];

const EVENT_HANDLERS = [
  OnCommentAddedHandler,
  OnCommentUpdatedHandler,
  OnCommentMentionedHandler,
  OnCommentAddedSubscriberHandler,
];

@Module({})
export class Comment2Module {
  static forRoot(options: Comment2ModuleOptions): DynamicModule {
    return {
      module: Comment2Module,
      imports: [CqrsModule],
      controllers: [CommentController],
      providers: [
        { provide: COMMENT2_OPTIONS, useValue: options },

        ...COMMAND_HANDLERS,
        ...QUERY_HANDLERS,
        ...EVENT_HANDLERS,
      ],
      exports: [
        COMMENT2_OPTIONS,
        // COMMENT_ENTITY_ACCESS_PORT is NOT registered here — consumers provide
        // their own implementation in their own module. Handlers inject it with
        // @Optional() so absence is safe (permission-based tier still applies).
      ],
    };
  }
}
