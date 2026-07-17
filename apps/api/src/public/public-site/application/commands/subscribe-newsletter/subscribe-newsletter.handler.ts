import { BadRequestException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NewsletterSubscriptionRepository } from '../../../infrastructure/repositories/newsletter-subscription.repository';
import { SubscribeNewsletterCommand } from './subscribe-newsletter.command';

@CommandHandler(SubscribeNewsletterCommand)
export class SubscribeNewsletterHandler
  implements ICommandHandler<SubscribeNewsletterCommand, { message: string }>
{
  constructor(private readonly repo: NewsletterSubscriptionRepository) {}

  async execute(command: SubscribeNewsletterCommand): Promise<{ message: string }> {
    const email = command.email?.trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new BadRequestException('A valid email address is required');
    }

    await this.repo.subscribe(email, command.ipAddress);

    return { message: 'Subscribed successfully' };
  }
}
