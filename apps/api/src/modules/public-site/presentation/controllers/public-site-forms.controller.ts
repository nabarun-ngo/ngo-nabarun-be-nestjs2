import { Body, Controller, Param, Post } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  ExpectedRecaptchaAction,
  Public,
  PublicFormPostThrottle,
} from '@ce/nestjs-shared-auth';
import { ApiAutoResponse } from '@ce/nestjs-shared-core';
import { SubmitPublicFormCommand } from '../../application/commands/submit-public-form/submit-public-form.command';
import { SubmitPublicFormResult } from '../../application/commands/submit-public-form/submit-public-form.handler';

@ApiTags('PublicSiteForms')
@Controller('public-site/forms')
@Public()
export class PublicSiteFormsController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post('submit-contact-request')
  @PublicFormPostThrottle()
  @ExpectedRecaptchaAction('submit_contact')
  @ApiOperation({ summary: 'Submit contact request' })
  @ApiAutoResponse(Object as never)
  submitContact(@Body() body: Record<string, unknown>) {
    return this.commandBus.execute(new SubmitPublicFormCommand('contact', body));
  }

  @Post('submit-join-request')
  @PublicFormPostThrottle()
  @ExpectedRecaptchaAction('submit_join')
  @ApiOperation({ summary: 'Submit join / volunteer request' })
  @ApiAutoResponse(Object as never)
  submitJoin(@Body() body: Record<string, unknown>) {
    return this.commandBus.execute(new SubmitPublicFormCommand('volunteer', body));
  }

  @Post('submit-dynamic-form/:formId')
  @PublicFormPostThrottle()
  @ApiOperation({ summary: 'Submit a generic dynamic public form' })
  @ApiAutoResponse(Object as never)
  submitDynamic(
    @Param('formId') formId: string,
    @Body() body: Record<string, unknown>,
  ): Promise<SubmitPublicFormResult> {
    return this.commandBus.execute(new SubmitPublicFormCommand(formId, body));
  }
}
