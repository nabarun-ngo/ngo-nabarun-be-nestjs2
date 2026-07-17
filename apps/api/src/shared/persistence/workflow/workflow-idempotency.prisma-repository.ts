import { Injectable } from '@nestjs/common';
import { BasePrismaService } from '@ce/nestjs-shared-persistence';
import {
  IWorkflowIdempotencyRepository,
  WorkflowIdempotencyClaimInput,
  WorkflowIdempotencyRecord,
  WorkflowIdempotencyScope,
} from '@ce/nestjs-shared-workflow';
import { Prisma, PrismaClient } from '../prisma/client';

type WorkflowIdempotencyKeyRow = {
  key: string;
  scope: string;
  instanceId: string | null;
  result: Prisma.JsonValue | null;
  expiresAt: Date;
  createdAt: Date;
};

@Injectable()
export class WorkflowIdempotencyPrismaRepository implements IWorkflowIdempotencyRepository {
  constructor(private readonly database: BasePrismaService<PrismaClient>) {}

  private get client(): PrismaClient {
    return this.database.client;
  }

  async claim(input: WorkflowIdempotencyClaimInput): Promise<{
    claimed: boolean;
    record: WorkflowIdempotencyRecord;
  }> {
    return this.client.$transaction(async (tx) => {
      const now = new Date();
      const existing = await tx.workflowIdempotencyKey.findUnique({
        where: { key: input.key },
      });

      if (existing && existing.expiresAt > now) {
        return {
          claimed: false,
          record: this.toRecord(existing as WorkflowIdempotencyKeyRow),
        };
      }

      if (existing) {
        await tx.workflowIdempotencyKey.delete({ where: { key: input.key } });
      }

      const expiresAt = new Date(Date.now() + input.ttlMs);

      try {
        const row = await tx.workflowIdempotencyKey.create({
          data: {
            key: input.key,
            scope: input.scope,
            instanceId: input.instanceId ?? null,
            expiresAt,
          },
        });

        return {
          claimed: true,
          record: this.toRecord(row as WorkflowIdempotencyKeyRow),
        };
      } catch (error) {
        if (!this.isUniqueConstraintError(error)) {
          throw error;
        }

        const raced = await tx.workflowIdempotencyKey.findUnique({
          where: { key: input.key },
        });

        if (!raced) {
          throw error;
        }

        return {
          claimed: false,
          record: this.toRecord(raced as WorkflowIdempotencyKeyRow),
        };
      }
    });
  }

  async complete(
    key: string,
    result: Record<string, unknown>,
  ): Promise<WorkflowIdempotencyRecord> {
    const row = await this.client.workflowIdempotencyKey.update({
      where: { key },
      data: {
        result: result as Prisma.InputJsonValue,
      },
    });

    return this.toRecord(row as WorkflowIdempotencyKeyRow);
  }

  async findByKey(key: string): Promise<WorkflowIdempotencyRecord | null> {
    const row = await this.client.workflowIdempotencyKey.findUnique({ where: { key } });
    return row ? this.toRecord(row as WorkflowIdempotencyKeyRow) : null;
  }

  async purgeExpired(before?: Date): Promise<number> {
    const cutoff = before ?? new Date();
    const result = await this.client.workflowIdempotencyKey.deleteMany({
      where: { expiresAt: { lt: cutoff } },
    });

    return result.count;
  }

  private toRecord(row: WorkflowIdempotencyKeyRow): WorkflowIdempotencyRecord {
    return {
      key: row.key,
      scope: row.scope as WorkflowIdempotencyScope,
      instanceId: row.instanceId,
      result: row.result ? (row.result as Record<string, unknown>) : null,
      expiresAt: row.expiresAt,
      createdAt: row.createdAt,
    };
  }

  private isUniqueConstraintError(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: string }).code === 'P2002'
    );
  }
}
