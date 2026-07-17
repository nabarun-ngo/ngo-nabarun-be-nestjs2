import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { CommandBus } from '@nestjs/cqrs';
import { AuthUser, CurrentUser, RequirePermissions, UnifiedAuthGuard } from '@ce/nestjs-shared-auth';
import { ApiAutoResponse } from '@ce/nestjs-shared-core';
import { FieldOption } from '../../domain/value-objects/field-option/field-option.vo';
import { FieldCondition } from '../../domain/value-objects/field-condition/field-condition.vo';
import { DependentOptions } from '../../domain/value-objects/dependent-options/dependent-options.vo';
import { FieldValidationRules } from '../../domain/value-objects/field-validation-rules/field-validation-rules.vo';
import { AddFormFieldCommand } from '../../application/commands/add-form-field/add-form-field.command';
import { UpdateFormFieldCommand } from '../../application/commands/update-form-field/update-form-field.command';
import { DisableFormFieldCommand } from '../../application/commands/disable-form-field/disable-form-field.command';
import { BulkUpdateFieldSortOrderCommand } from '../../application/commands/bulk-update-field-sort-order/bulk-update-field-sort-order.command';
import { FormFieldDefinitionResponseDto } from '../../application/dtos/response/form-response.dtos';
import {
  AddFormFieldDto,
  BulkUpdateFieldSortOrderDto,
  UpdateFormFieldDto,
} from '../../application/dtos/request/form-field-request.dtos';

@ApiTags('Custom Forms — Fields')
@ApiBearerAuth('jwt')
@ApiSecurity('api-key')
@UseGuards(UnifiedAuthGuard)
@Controller('custom-forms/forms/:formId/fields')
export class FormFieldController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('update:custom_forms')
  @ApiAutoResponse(FormFieldDefinitionResponseDto, { status: 201 })
  addField(
    @Param('formId') formId: string,
    @Body() dto: AddFormFieldDto,
    @CurrentUser() user: AuthUser,
  ): Promise<FormFieldDefinitionResponseDto> {
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
    const validationRules = dto.validationRules
      ? FieldValidationRules.of(dto.validationRules.pattern, dto.validationRules.regexErrMsg, dto.fieldType)
      : null;

    return this.commandBus.execute(
      new AddFormFieldCommand(
        formId,
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
        validationRules,
      ),
    );
  }

  @Patch('sort-order/bulk')
  @RequirePermissions('update:custom_forms')
  @ApiAutoResponse(FormFieldDefinitionResponseDto, { isArray: true })
  bulkUpdateSortOrder(
    @Param('formId') formId: string,
    @Body() dto: BulkUpdateFieldSortOrderDto,
    @CurrentUser() user: AuthUser,
  ): Promise<FormFieldDefinitionResponseDto[]> {
    return this.commandBus.execute(
      new BulkUpdateFieldSortOrderCommand(
        formId,
        dto.items,
        user.userId!,
        user.permissions ?? [],
      ),
    );
  }

  @Patch(':fieldId')
  @RequirePermissions('update:custom_forms')
  @ApiAutoResponse(FormFieldDefinitionResponseDto)
  updateField(
    @Param('formId') formId: string,
    @Param('fieldId') fieldId: string,
    @Body() dto: UpdateFormFieldDto,
    @CurrentUser() user: AuthUser,
  ): Promise<FormFieldDefinitionResponseDto> {
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
    const validationRules =
      'validationRules' in dto
        ? dto.validationRules
          ? FieldValidationRules.of(
              dto.validationRules.pattern,
              dto.validationRules.regexErrMsg,
              dto.fieldType!,
            )
          : null
        : undefined;

    return this.commandBus.execute(
      new UpdateFormFieldCommand(
        formId,
        fieldId,
        dto.label,
        dto.fieldType,
        dto.mandatory,
        fieldOptions,
        dto.isHidden,
        dto.isEncrypted,
        dto.sortOrder,
        user.userId!,
        user.permissions ?? [],
        condition,
        dependentOptions,
        dto.viewPermissions,
        validationRules,
      ),
    );
  }

  @Post(':fieldId/disable')
  @RequirePermissions('disable:custom_forms')
  @ApiAutoResponse(FormFieldDefinitionResponseDto)
  disableField(
    @Param('formId') formId: string,
    @Param('fieldId') fieldId: string,
    @CurrentUser() user: AuthUser,
  ): Promise<FormFieldDefinitionResponseDto> {
    return this.commandBus.execute(
      new DisableFormFieldCommand(formId, fieldId, user.userId!, user.permissions ?? []),
    );
  }
}
