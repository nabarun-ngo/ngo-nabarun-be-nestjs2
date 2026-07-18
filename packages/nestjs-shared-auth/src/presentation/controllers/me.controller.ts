import { Controller, Get } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../decorators/current-user.decorator';
import { AuthUser } from '../../application/models/auth-user';

@ApiBearerAuth('jwt')
@ApiSecurity('api-key')
@ApiTags('Auth — Me')
@Controller('auth/me')
export class MeController {
  @Get()
  @ApiOperation({ summary: 'Get current user profile and permissions' })
  @ApiOkResponse({
    description: 'Current user profile and permissions',
    schema: {
      properties: {
        info: { type: 'string', example: 'Success' },
        timestamp: { type: 'string', format: 'date-time' },
        traceId: { type: 'string' },
        responsePayload: {
          type: 'object',
          description: 'AuthUser — type, sub, permissions, userRoles, roleGroups',
        },
      },
    },
  })
  getMe(@CurrentUser() user: AuthUser): AuthUser {
    return user;
  }
}
