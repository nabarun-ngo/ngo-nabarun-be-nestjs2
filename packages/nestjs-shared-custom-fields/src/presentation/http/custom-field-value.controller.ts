import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { AuthUser, CurrentUser, RequirePermissions, UnifiedAuthGuard } from '@ce/nestjs-shared-auth';
import { ApiAutoResponse, ApiAutoVoidResponse } from '@ce/nestjs-shared-core';
import { SetEntityFieldValuesCommand } from '../../application/commands/set-entity-field-values/set-entity-field-values.command';
import { DeleteEntityFieldValuesCommand } from '../../application/commands/delete-entity-field-values/delete-entity-field-values.command';
import { GetEntityFieldValuesQuery } from '../../application/queries/get-entity-field-values/get-entity-field-values.query';
import { ValidateEntityFieldsQuery } from '../../application/queries/validate-entity-fields/validate-entity-fields.query';
import { GetEntityFieldValueHistoryQuery } from '../../application/queries/get-entity-field-value-history/get-entity-field-value-history.query';
import {
  DeleteEntityFieldValuesRequestDto,
  GetEntityFieldValueHistoryRequestDto,
  GetEntityFieldValuesRequestDto,
  SetEntityFieldValuesRequestDto,
  ValidateEntityFieldsRequestDto,
} from '../../application/dtos/request/custom-field-value-request.dtos';
import {
  EntityFieldValidationResultResponseDto,
  GetEntityFieldValuesResponseDto,
  GetFieldValueHistoryResponseDto,
  ResolvedCustomFieldValueResponseDto,
} from '../../application/dtos/response/custom-field-response.dtos';

@ApiTags('Custom Fields 2 — Values')
@ApiBearerAuth('jwt')
@ApiSecurity('api-key')
@UseGuards(UnifiedAuthGuard)
@Controller('custom-fields/values')
export class CustomFieldValueController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('write:custom_field_values')
  @ApiAutoResponse(ResolvedCustomFieldValueResponseDto, { isArray: true })
  setValues(
    @Body() dto: SetEntityFieldValuesRequestDto,
    @CurrentUser() user: AuthUser,
  ): Promise<ResolvedCustomFieldValueResponseDto[]> {
    const valuesMap = Object.fromEntries(dto.values.map((v) => [v.key, v.value]));
    return this.commandBus.execute(
      new SetEntityFieldValuesCommand(
        dto.entityType,
        dto.entityId,
        valuesMap,
        user.userId!,
        user.permissions ?? [],
      ),
    );
  }

  @Get()
  @RequirePermissions('read:custom_field_values')
  @ApiAutoResponse(GetEntityFieldValuesResponseDto)
  getValues(
    @Query() dto: GetEntityFieldValuesRequestDto,
    @CurrentUser() user: AuthUser,
  ): Promise<GetEntityFieldValuesResponseDto> {
    return this.queryBus.execute(
      new GetEntityFieldValuesQuery(dto.entityType, dto.entityId, user.permissions ?? []),
    );
  }

  @Get('validate')
  @RequirePermissions('read:custom_field_values')
  @ApiAutoResponse(EntityFieldValidationResultResponseDto)
  validateFields(
    @Query() dto: ValidateEntityFieldsRequestDto,
    @CurrentUser() user: AuthUser,
  ): Promise<EntityFieldValidationResultResponseDto> {
    return this.queryBus.execute(
      new ValidateEntityFieldsQuery(dto.entityType, dto.entityId, user.permissions ?? []),
    );
  }

  @Get('history')
  @RequirePermissions('read:custom_field_values')
  @ApiAutoResponse(GetFieldValueHistoryResponseDto)
  getHistory(
    @Query() dto: GetEntityFieldValueHistoryRequestDto,
    @CurrentUser() user: AuthUser,
  ): Promise<GetFieldValueHistoryResponseDto> {
    return this.queryBus.execute(
      new GetEntityFieldValueHistoryQuery(
        dto.entityType,
        dto.entityId,
        user.permissions ?? [],
        dto.fieldKey,
      ),
    );
  }

  @Delete(':entityType/:entityId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions('delete:custom_field_values')
  @ApiAutoVoidResponse({ status: 204 })
  deleteEntityValues(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
    @CurrentUser() user: AuthUser,
  ): Promise<void> {
    return this.commandBus.execute(
      new DeleteEntityFieldValuesCommand(
        entityType,
        entityId,
        user.userId!,
        user.permissions ?? [],
      ),
    );
  }
}
