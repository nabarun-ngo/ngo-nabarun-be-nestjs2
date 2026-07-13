import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { AuthUser, CurrentUser, RequirePermissions, UnifiedAuthGuard } from '@ce/nestjs-shared-auth';
import { ApiAutoResponse, ApiAutoVoidResponse } from '@ce/nestjs-shared-core';
import { FieldOption } from '../../domain/value-objects/field-option/field-option.vo';
import { FieldCondition } from '../../domain/value-objects/field-condition/field-condition.vo';
import { DependentOptions } from '../../domain/value-objects/dependent-options/dependent-options.vo';
import { DefineFieldDefinitionCommand } from '../../application/commands/define-field-definition/define-field-definition.command';
import { UpdateFieldDefinitionCommand } from '../../application/commands/update-field-definition/update-field-definition.command';
import { DeactivateFieldDefinitionCommand } from '../../application/commands/deactivate-field-definition/deactivate-field-definition.command';
import { BulkUpdateSortOrderCommand } from '../../application/commands/bulk-update-sort-order/bulk-update-sort-order.command';
import { ListFieldDefinitionsQuery } from '../../application/queries/list-field-definitions/list-field-definitions.query';
import {
  CustomFieldDefinitionResponseDto,
  ListFieldDefinitionsResponseDto,
} from '../../application/dtos/response/custom-field-response.dtos';
import {
  BulkUpdateSortOrderRequestDto,
  DefineFieldDefinitionRequestDto,
  ListFieldDefinitionsRequestDto,
  UpdateFieldDefinitionRequestDto,
} from '../../application/dtos/request/custom-field-definition-request.dtos';

@ApiTags('Custom Fields 2 — Definitions')
@ApiBearerAuth('jwt')
@ApiSecurity('api-key')
@UseGuards(UnifiedAuthGuard)
@Controller('custom-fields/definitions')
export class CustomFieldDefinitionController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('create:custom_field_definitions')
  @ApiAutoResponse(CustomFieldDefinitionResponseDto, { status: 201 })
  defineField(
    @Body() dto: DefineFieldDefinitionRequestDto,
    @CurrentUser() user: AuthUser,
  ): Promise<CustomFieldDefinitionResponseDto> {
    const fieldOptions = (dto.fieldOptions ?? []).map((o) => FieldOption.of(o.key, o.label));
    const condition = dto.condition
      ? FieldCondition.of(dto.condition.dependsOnKey, dto.condition.operator, dto.condition.value)
      : null;
    const dependentOptions = dto.dependentOptions
      ? DependentOptions.of(
          dto.dependentOptions.dependsOnKey,
          Object.fromEntries(
            Object.entries(dto.dependentOptions.optionMap).map(([k, opts]) => [
              k,
              opts.map((o) => FieldOption.of(o.key, o.label)),
            ]),
          ),
        )
      : null;

    return this.commandBus.execute(
      new DefineFieldDefinitionCommand(
        dto.entityType,
        dto.key,
        dto.label,
        dto.fieldType,
        dto.mandatory ?? false,
        fieldOptions,
        dto.isHidden ?? false,
        dto.isEncrypted ?? false,
        dto.sortOrder ?? 0,
        user.userId!,
        user.permissions ?? [],
        condition,
        dependentOptions,
        dto.viewPermissions ?? [],
      ),
    );
  }

  @Get()
  @RequirePermissions('read:custom_field_definitions')
  @ApiAutoResponse(ListFieldDefinitionsResponseDto)
  listDefinitions(
    @Query() dto: ListFieldDefinitionsRequestDto,
    @CurrentUser() user: AuthUser,
  ): Promise<ListFieldDefinitionsResponseDto> {
    return this.queryBus.execute(
      new ListFieldDefinitionsQuery(
        dto.entityType,
        user.permissions ?? [],
        dto.activeOnly ?? true,
        dto.includeHidden ?? false,
      ),
    );
  }

  @Patch('sort-order/bulk')
  @RequirePermissions('update:custom_field_definitions')
  @ApiAutoResponse(CustomFieldDefinitionResponseDto, { isArray: true })
  bulkUpdateSortOrder(
    @Body() dto: BulkUpdateSortOrderRequestDto,
    @CurrentUser() user: AuthUser,
  ): Promise<CustomFieldDefinitionResponseDto[]> {
    return this.commandBus.execute(
      new BulkUpdateSortOrderCommand(
        dto.entityType,
        dto.items,
        user.userId!,
        user.permissions ?? [],
      ),
    );
  }

  @Patch(':id')
  @RequirePermissions('update:custom_field_definitions')
  @ApiAutoResponse(CustomFieldDefinitionResponseDto)
  updateDefinition(
    @Param('id') id: string,
    @Body() dto: UpdateFieldDefinitionRequestDto,
    @CurrentUser() user: AuthUser,
  ): Promise<CustomFieldDefinitionResponseDto> {
    const fieldOptions = dto.fieldOptions
      ? dto.fieldOptions.map((o) => FieldOption.of(o.key, o.label))
      : undefined;
    const condition =
      'condition' in dto
        ? dto.condition
          ? FieldCondition.of(
              dto.condition.dependsOnKey,
              dto.condition.operator,
              dto.condition.value,
            )
          : null
        : undefined;
    const dependentOptions =
      'dependentOptions' in dto
        ? dto.dependentOptions
          ? DependentOptions.of(
              dto.dependentOptions.dependsOnKey,
              Object.fromEntries(
                Object.entries(dto.dependentOptions.optionMap).map(([k, opts]) => [
                  k,
                  opts.map((o) => FieldOption.of(o.key, o.label)),
                ]),
              ),
            )
          : null
        : undefined;

    return this.commandBus.execute(
      new UpdateFieldDefinitionCommand(
        id,
        user.userId!,
        user.permissions ?? [],
        dto.label,
        dto.fieldType,
        dto.mandatory,
        fieldOptions,
        dto.isHidden,
        dto.isEncrypted,
        dto.active,
        dto.sortOrder,
        condition,
        dependentOptions,
        dto.viewPermissions,
      ),
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('delete:custom_field_definitions')
  @ApiAutoResponse(CustomFieldDefinitionResponseDto)
  deactivateDefinition(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ): Promise<CustomFieldDefinitionResponseDto> {
    return this.commandBus.execute(
      new DeactivateFieldDefinitionCommand(id, user.userId!, user.permissions ?? []),
    );
  }
}
