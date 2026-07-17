import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiProperty, ApiPropertyOptional, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { FormStatus } from '../../domain/enums/form-status.enum';
import { AuthUser, CurrentUser, RequirePermissions, UnifiedAuthGuard } from '@ce/nestjs-shared-auth';
import { ApiAutoResponse } from '@ce/nestjs-shared-core';
import { CreateFormCommand } from '../../application/commands/create-form/create-form.command';
import { UpdateFormCommand } from '../../application/commands/update-form/update-form.command';
import { PublishFormCommand } from '../../application/commands/publish-form/publish-form.command';
import { DisableFormCommand } from '../../application/commands/disable-form/disable-form.command';
import { ListFormsQuery } from '../../application/queries/list-forms/list-forms.query';
import { GetFormWithFieldsQuery } from '../../application/queries/get-form-with-fields/get-form-with-fields.query';
import { FormResponseDto } from '../../application/dtos/response/form-response.dtos';
import {
  CreateFormDto,
  UpdateFormDto,
} from '../../application/dtos/request/form-request.dtos';

class ListFormsRequestDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  entityType: string;

  @ApiPropertyOptional({ enum: FormStatus })
  @IsEnum(FormStatus)
  @IsOptional()
  status?: FormStatus;
}

@ApiTags('Custom Forms')
@ApiBearerAuth('jwt')
@ApiSecurity('api-key')
@UseGuards(UnifiedAuthGuard)
@Controller('custom-forms/forms')
export class FormController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('create:custom_forms')
  @ApiAutoResponse(FormResponseDto, { status: 201 })
  createForm(
    @Body() dto: CreateFormDto,
    @CurrentUser() user: AuthUser,
  ): Promise<FormResponseDto> {
    return this.commandBus.execute(
      new CreateFormCommand(
        dto.entityType,
        dto.key,
        dto.label,
        dto.description ?? null,
        dto.managePermissions ?? [],
        dto.readPermissions ?? [],
        dto.writePermissions ?? [],
        user.userId!,
        user.permissions ?? [],
      ),
    );
  }

  @Get()
  @RequirePermissions('read:custom_forms')
  @ApiAutoResponse(FormResponseDto, { isArray: true })
  listForms(
    @Query() dto: ListFormsRequestDto,
    @CurrentUser() user: AuthUser,
  ): Promise<FormResponseDto[]> {
    return this.queryBus.execute(
      new ListFormsQuery(dto.entityType, dto.status, user.permissions ?? []),
    );
  }

  @Get(':formId')
  @RequirePermissions('read:custom_forms')
  @ApiAutoResponse(FormResponseDto)
  getFormWithFields(
    @Param('formId') formId: string,
    @CurrentUser() user: AuthUser,
  ): Promise<FormResponseDto> {
    return this.queryBus.execute(
      new GetFormWithFieldsQuery(formId, user.permissions ?? []),
    );
  }

  @Patch(':formId')
  @RequirePermissions('update:custom_forms')
  @ApiAutoResponse(FormResponseDto)
  updateForm(
    @Param('formId') formId: string,
    @Body() dto: UpdateFormDto,
    @CurrentUser() user: AuthUser,
  ): Promise<FormResponseDto> {
    return this.commandBus.execute(
      new UpdateFormCommand(
        formId,
        dto.label,
        dto.description,
        dto.managePermissions,
        dto.readPermissions,
        dto.writePermissions,
        user.userId!,
        user.permissions ?? [],
      ),
    );
  }

  @Post(':formId/publish')
  @RequirePermissions('update:custom_forms')
  @ApiAutoResponse(FormResponseDto)
  publishForm(
    @Param('formId') formId: string,
    @CurrentUser() user: AuthUser,
  ): Promise<FormResponseDto> {
    return this.commandBus.execute(
      new PublishFormCommand(formId, user.userId!, user.permissions ?? []),
    );
  }

  @Post(':formId/disable')
  @RequirePermissions('disable:custom_forms')
  @ApiAutoResponse(FormResponseDto)
  disableForm(
    @Param('formId') formId: string,
    @CurrentUser() user: AuthUser,
  ): Promise<FormResponseDto> {
    return this.commandBus.execute(
      new DisableFormCommand(formId, user.userId!, user.permissions ?? []),
    );
  }
}
