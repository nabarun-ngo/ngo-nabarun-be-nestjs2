import { CommentModule } from "@nabarun-ngo/nestjs-shared-comment";

export const COMMENT_MODULE = CommentModule.forRoot({
    allowedEntityTypes: [
        {
            entityType: 'donation',
            readPermissions: ['donations:read'],
            writePermissions: ['donations:comment'],
        },
        {
            entityType: 'task',
            readPermissions: ['tasks:read'],
            writePermissions: ['tasks:write'],
        },
        {
            entityType: 'announcement',
        },
    ],
    notifications: {
        mentionTemplateKey: 'COMMENT_MENTION',
        subscriberTemplateKey: 'COMMENT_ADDED',
        notifySubscribers: true,
    },
});