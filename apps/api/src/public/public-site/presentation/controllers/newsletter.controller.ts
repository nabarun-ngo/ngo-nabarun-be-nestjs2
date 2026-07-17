import { Body, Controller, Post, Req } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';
import { Request } from 'express';
import {
  ExpectedRecaptchaAction,
  NewsletterThrottle,
  Public,
} from '@ce/nestjs-shared-auth';
import { ApiAutoResponse } from '@ce/nestjs-shared-core';
import { SubscribeNewsletterCommand } from '../../application/commands/subscribe-newsletter/subscribe-newsletter.command';

export class NewsletterSubscribeDto {
  @IsEmail()
  @IsString()
  email!: string;
}

@ApiTags('Newsletter')
@Controller()
@Public()
export class NewsletterController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post('newsletter')
  @NewsletterThrottle()
  @ExpectedRecaptchaAction('newsletter')
  @ApiOperation({ summary: 'Subscribe to newsletter' })
  @ApiAutoResponse(Object as never)
  subscribe(@Body() dto: NewsletterSubscribeDto, @Req() req: Request) {
    return this.commandBus.execute(
      new SubscribeNewsletterCommand(dto.email, req.ip),
    );
  }
}
