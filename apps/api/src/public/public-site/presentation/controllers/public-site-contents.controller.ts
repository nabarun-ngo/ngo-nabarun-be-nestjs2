import { Controller, Get, Param } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { BypassSuccessEnvelope } from '@ce/nestjs-shared-core';
import { PublicGetThrottle, UseApiKey } from '@ce/nestjs-shared-auth';
import { GetStaticContentQuery } from '../../application/queries/get-static-content/get-static-content.query';
import { GetDynamicContentQuery } from '../../application/queries/get-dynamic-content/get-dynamic-content.query';
import { GetFormDefinitionQuery } from '../../application/queries/get-form-definition/get-form-definition.query';

@ApiTags('PublicSiteContents')
@Controller('public-site/contents')
@UseApiKey()
@ApiSecurity('api-key')
@BypassSuccessEnvelope()
export class PublicSiteContentsController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get('static')
  @PublicGetThrottle()
  @ApiOperation({ summary: 'Get static public site content' })
  getStatic() {
    return this.queryBus.execute(new GetStaticContentQuery());
  }

  @Get('dynamic')
  @PublicGetThrottle()
  @ApiOperation({ summary: 'Get dynamic public site content (team, events)' })
  getDynamic() {
    return this.queryBus.execute(new GetDynamicContentQuery());
  }

  @Get(':formId/form-defination')
  @PublicGetThrottle()
  @ApiOperation({ summary: 'Get form definition for a public form' })
  getFormDefinition(@Param('formId') formId: string) {
    return this.queryBus.execute(new GetFormDefinitionQuery(formId));
  }
}
