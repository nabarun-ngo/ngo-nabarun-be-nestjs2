import { Injectable } from '@nestjs/common';
import { BasePrismaService } from '@nabarun-ngo/nestjs-shared-persistence';
import { PrismaClient } from '../../../../shared/persistence/prisma/client';
import { randomUUID } from 'crypto';

@Injectable()
export class NewsletterSubscriptionRepository {
  constructor(private readonly database: BasePrismaService<PrismaClient>) { }

  private get client(): PrismaClient {
    return this.database.client;
  }

  async subscribe(email: string, ipAddress?: string): Promise<void> {
    const normalised = email.trim().toLowerCase();
    const id = randomUUID();

    await this.client.$executeRaw`
      INSERT INTO "newsletter_subscriptions" ("id", "email", "ipAddress", "status")
      VALUES (${id}, ${normalised}, ${ipAddress ?? null}, 'active')
      ON CONFLICT ("email") DO UPDATE SET
        "ipAddress" = EXCLUDED."ipAddress",
        "status" = 'active'
    `;
  }
}
