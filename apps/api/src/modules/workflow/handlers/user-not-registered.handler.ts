import { Injectable } from '@nestjs/common';
import { BusinessException } from '@nabarun-ngo/nestjs-shared-core';
import { BasePrismaService } from '@nabarun-ngo/nestjs-shared-persistence';
import {
  WorkflowTaskHandler,
  WorkflowTaskHandlerContract,
} from '@nabarun-ngo/nestjs-shared-workflow';
import { PrismaClient } from '../../../shared/persistence/prisma/client';

@Injectable()
@WorkflowTaskHandler('UserNotRegisteredTaskHandler')
export class UserNotRegisteredTaskHandler implements WorkflowTaskHandlerContract {
  constructor(private readonly prisma: BasePrismaService<PrismaClient>) { }

  async execute(params: {
    instanceId: string;
    elementId: string;
    input: Record<string, unknown>;
  }): Promise<void> {
    const email = params.input.email;
    if (typeof email !== 'string' || !email.trim()) {
      throw new BusinessException('Email is required for duplicate-user check.');
    }

    const existing = await this.prisma.userProfile.findFirst({
      where: { email: email.trim() },
      select: { id: true },
    });

    if (existing) {
      throw new BusinessException(`User already registered: ${email}`);
    }
  }
}
