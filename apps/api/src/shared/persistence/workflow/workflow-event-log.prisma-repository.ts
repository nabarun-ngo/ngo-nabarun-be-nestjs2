import { Injectable } from '@nestjs/common';
import { BasePrismaService } from '@nabarun-ngo/nestjs-shared-persistence';
import {
  AppendWorkflowEventInput,
  IWorkflowEventLogRepository,
  WorkflowEventLogEntry,
} from '@nabarun-ngo/nestjs-shared-workflow';
import { Prisma, PrismaClient } from '../prisma/client';

type WorkflowEventLogRow = {
  id: string;
  instanceId: string;
  sequence: number;
  eventType: string;
  elementId: string | null;
  actorType: string;
  actorId: string | null;
  payload: Prisma.JsonValue;
  correlationId: string | null;
  occurredAt: Date;
};

@Injectable()
export class WorkflowEventLogPrismaRepository implements IWorkflowEventLogRepository {
  constructor(private readonly database: BasePrismaService<PrismaClient>) { }

  private get client(): PrismaClient {
    return this.database.client;
  }

  async append(input: AppendWorkflowEventInput): Promise<WorkflowEventLogEntry> {
    const [entry] = await this.appendMany([input]);
    return entry;
  }

  async appendMany(inputs: AppendWorkflowEventInput[]): Promise<WorkflowEventLogEntry[]> {
    if (inputs.length === 0) {
      return [];
    }

    return this.client.$transaction(async (tx) => {
      const instanceId = inputs[0].instanceId;
      const latest = await tx.workflowEventLog.aggregate({
        where: { instanceId },
        _max: { sequence: true },
      });

      let nextSequence = latest._max.sequence ?? 0;
      const created: WorkflowEventLogEntry[] = [];

      for (const input of inputs) {
        if (input.instanceId !== instanceId) {
          throw new Error('appendMany requires all entries to share the same instanceId');
        }

        nextSequence += 1;
        const row = await tx.workflowEventLog.create({
          data: {
            instanceId: input.instanceId,
            sequence: nextSequence,
            eventType: input.eventType,
            elementId: input.elementId ?? null,
            actorType: input.actorType,
            actorId: input.actorId ?? null,
            payload: (input.payload ?? {}) as Prisma.InputJsonValue,
            correlationId: input.correlationId ?? null,
            occurredAt: input.occurredAt ?? new Date(),
          },
        });

        created.push(this.toEntry(row as WorkflowEventLogRow));
      }

      return created;
    });
  }

  async findByInstance(
    instanceId: string,
    options?: { fromSequence?: number; limit?: number },
  ): Promise<WorkflowEventLogEntry[]> {
    const rows = await this.client.workflowEventLog.findMany({
      where: {
        instanceId,
        ...(options?.fromSequence != null ? { sequence: { gte: options.fromSequence } } : {}),
      },
      orderBy: { sequence: 'asc' },
      ...(options?.limit != null ? { take: options.limit } : {}),
    });

    return rows.map((row) => this.toEntry(row as WorkflowEventLogRow));
  }

  async getLatestSequence(instanceId: string): Promise<number> {
    const result = await this.client.workflowEventLog.aggregate({
      where: { instanceId },
      _max: { sequence: true },
    });

    return result._max.sequence ?? 0;
  }

  private toEntry(row: WorkflowEventLogRow): WorkflowEventLogEntry {
    return {
      id: row.id,
      instanceId: row.instanceId,
      sequence: row.sequence,
      eventType: row.eventType,
      elementId: row.elementId,
      actorType: row.actorType as WorkflowEventLogEntry['actorType'],
      actorId: row.actorId,
      payload: (row.payload ?? {}) as Record<string, unknown>,
      correlationId: row.correlationId,
      occurredAt: row.occurredAt,
    };
  }
}
