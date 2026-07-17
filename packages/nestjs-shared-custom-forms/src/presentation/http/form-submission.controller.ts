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
import { ApiBearerAuth, ApiProperty, ApiPropertyOptional, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { AuthUser, CurrentUser, RequirePermissions, UnifiedAuthGuard } from '@ce/nestjs-shared-auth';
import { ApiAutoResponse, ApiAutoVoidResponse } from '@ce/nestjs-shared-core';
import { SaveFormDraftCommand } from '../../application/commands/save-form-draft/save-form-draft.command';
import { SubmitFormCommand } from '../../application/commands/submit-form/submit-form.command';
import { ClearFormSubmissionCommand } from '../../application/commands/clear-form-submission/clear-form-submission.command';
import { GetFormSubmissionQuery } from '../../application/queries/get-form-submission/get-form-submission.query';
import { ValidateFormSubmissionQuery } from '../../application/queries/validate-form-submission/validate-form-submission.query';
import { GetFormSubmissionHistoryQuery } from '../../application/queries/get-form-submission-history/get-form-submission-history.query';
import {
  SaveFormDraftDto,
  SubmitFormDto,
} from '../../application/dtos/request/form-submission-request.dtos';
import {
  FormFieldValueHistoryEntryResponseDto,
  FormValidationResultResponseDto,
  ResolvedFormFieldValueResponseDto,
} from '../../application/dtos/response/form-response.dtos';

class FormSubmissionQueryDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  formId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  entityType: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  entityId: string;
}

class FormSubmissionHistoryQueryDto extends FormSubmissionQueryDto {
  @ApiPropertyOptional({ description: 'Filter to a specific field key' })
  @IsString()
  @IsOptional()
  fieldKey?: string;
}

@ApiTags('Custom Forms — Submissions')
@ApiBearerAuth('jwt')
@ApiSecurity('api-key')
@UseGuards(UnifiedAuthGuard)
@Controller('custom-forms/submissions')
export class FormSubmissionController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post('draft')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('write:form_submissions')
  @ApiAutoResponse(ResolvedFormFieldValueResponseDto, { isArray: true })
  saveDraft(
    @Query('formId') formId: string,
    @Body() dto: SaveFormDraftDto,
    @CurrentUser() user: AuthUser,
  ): Promise<ResolvedFormFieldValueResponseDto[]> {
    return this.commandBus.execute(
      new SaveFormDraftCommand(
        formId,
        dto.entityType,
        dto.entityId,
        dto.values,
        user.userId!,
        user.permissions ?? [],
      ),
    );
  }

  @Post('submit')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('submit:form_submissions')
  @ApiAutoVoidResponse()
  submitForm(
    @Query('formId') formId: string,
    @Body() dto: SubmitFormDto,
    @CurrentUser() user: AuthUser,
  ): Promise<void> {
    return this.commandBus.execute(
      new SubmitFormCommand(
        formId,
        dto.entityType,
        dto.entityId,
        dto.values,
        user.userId!,
        user.permissions ?? [],
      ),
    );
  }

  @Get()
  @RequirePermissions('read:form_submissions')
  @ApiAutoResponse(ResolvedFormFieldValueResponseDto, { isArray: true })
  getSubmission(
    @Query() dto: FormSubmissionQueryDto,
    @CurrentUser() user: AuthUser,
  ): Promise<ResolvedFormFieldValueResponseDto[]> {
    return this.queryBus.execute(
      new GetFormSubmissionQuery(
        dto.formId,
        dto.entityType,
        dto.entityId,
        user.permissions ?? [],
      ),
    );
  }

  @Get('validate')
  @RequirePermissions('read:form_submissions')
  @ApiAutoResponse(FormValidationResultResponseDto)
  validateSubmission(
    @Query() dto: FormSubmissionQueryDto,
    @CurrentUser() user: AuthUser,
  ): Promise<FormValidationResultResponseDto> {
    return this.queryBus.execute(
      new ValidateFormSubmissionQuery(
        dto.formId,
        dto.entityType,
        dto.entityId,
        user.permissions ?? [],
      ),
    );
  }

  @Get('history')
  @RequirePermissions('read:form_submissions')
  @ApiAutoResponse(FormFieldValueHistoryEntryResponseDto, { isArray: true })
  getHistory(
    @Query() dto: FormSubmissionHistoryQueryDto,
    @CurrentUser() user: AuthUser,
  ): Promise<FormFieldValueHistoryEntryResponseDto[]> {
    return this.queryBus.execute(
      new GetFormSubmissionHistoryQuery(
        dto.formId,
        dto.entityType,
        dto.entityId,
        user.permissions ?? [],
        dto.fieldKey,
      ),
    );
  }

  @Delete(':entityType/:entityId/:formId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions('clear:form_submissions')
  @ApiAutoVoidResponse({ status: 204 })
  clearSubmission(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
    @Param('formId') formId: string,
    @CurrentUser() user: AuthUser,
  ): Promise<void> {
    return this.commandBus.execute(
      new ClearFormSubmissionCommand(
        formId,
        entityType,
        entityId,
        user.userId!,
        user.permissions ?? [],
      ),
    );
  }
}
