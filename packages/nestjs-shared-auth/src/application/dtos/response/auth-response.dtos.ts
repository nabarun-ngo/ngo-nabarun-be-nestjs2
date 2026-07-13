import { ApiProperty } from '@nestjs/swagger';
import { ScopedRoleContext } from '../../models/auth-user';

export class ApiKeyResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiProperty({ required: false }) token?: string;
  @ApiProperty({ type: [String] }) permissions: string[];
  @ApiProperty({ required: false }) expiresAt?: Date;
  @ApiProperty({ required: false }) lastUsedAt?: Date;
  @ApiProperty({ required: false }) ownerId?: string;
  @ApiProperty({ required: false }) createdBy?: string;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
}

export class RoleResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() key: string;
  @ApiProperty({ required: false }) description?: string;
  @ApiProperty({ type: [String] }) permissionKeys: string[];
  @ApiProperty() createdAt: Date;
}

export class PermissionResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() key: string;
  @ApiProperty({ required: false }) description?: string;
  @ApiProperty() createdAt: Date;
}

export class UserRoleResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() idpSub: string;
  @ApiProperty() roleId: string;
  @ApiProperty({ required: false }) roleKey?: string;
  @ApiProperty({ required: false }) sourceGroupId?: string;
  @ApiProperty({ required: false }) entityId?: string;
  @ApiProperty({ required: false }) entityType?: string;
  @ApiProperty() grantedAt: Date;
  @ApiProperty({ required: false }) revokedAt?: Date;
  @ApiProperty({ required: false }) grantedBy?: string;
  @ApiProperty({ required: false }) note?: string;
}

export class UserRoleGroupResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() idpSub: string;
  @ApiProperty() groupId: string;
  @ApiProperty({ required: false }) groupKey?: string;
  @ApiProperty({ required: false }) entityId?: string;
  @ApiProperty({ required: false }) entityType?: string;
  @ApiProperty() grantedAt: Date;
  @ApiProperty({ required: false }) revokedAt?: Date;
  @ApiProperty({ required: false }) grantedBy?: string;
  @ApiProperty({ required: false }) revokedBy?: string;
  @ApiProperty({ required: false }) note?: string;
}

export class RbacResponseDto {
  @ApiProperty({ type: [String] }) permissions: string[];
  @ApiProperty({ type: [String] }) roles: string[];
  @ApiProperty({ type: [String] }) roleGroups: string[];
  @ApiProperty({
    required: false,
    additionalProperties: {
      type: 'object',
      additionalProperties: {
        anyOf: [
          { type: 'string' },
          { type: 'number' },
          { type: 'boolean' },
          { type: 'array', items: { type: 'string' } },
          {
            type: 'object',
            additionalProperties: { type: 'string' },
          },
        ],
      },
    },
  })
  scopedRoles?: Record<string, ScopedRoleContext>;
}
