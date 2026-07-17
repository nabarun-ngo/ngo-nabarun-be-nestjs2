import { Injectable } from '@nestjs/common';
import { BasePrismaService } from '@ce/nestjs-shared-persistence';
import {
  CreateWorkflowOutboxInput,
  IWorkflowOutboxRepository,
  WorkflowOutboxRecord,
  WorkflowOutboxStatus,
} from '@ce/nestjs-shared-workflow';
import { Prisma, PrismaClient } from '../prisma/client';

type WorkflowOutboxRow = {
  id: string;
  instanceId: string;
  eventType: string;
  payload: Prisma.JsonValue;
  status: string;
  createdAt: Date;
  dispatchedAt: Date | null;
  lastError: string | null;
};

@Injectable()
export class WorkflowOutboxPrismaRepository implements IWorkflowOutboxRepository {
  constructor(private readonly database: BasePrismaService<PrismaClient>) {}

  private get client(): PrismaClient {
    return this.database.client;
  }

  async create(input: CreateWorkflowOutboxInput): Promise<WorkflowOutboxRecord> {
    const row = await this.client.workflowOutbox.create({
      data: {
        instanceId: input.instanceId,
        eventType: input.eventType,
        payload: input.payload as Prisma.InputJsonValue,
        status: WorkflowOutboxStatus.Pending,
      },
    });

    return this.toRecord(row as WorkflowOutboxRow);
  }

  async findPendingBatch(limit: number): Promise<WorkflowOutboxRecord[]> {
    const rows = await this.client.workflowOutbox.findMany({
      where: { status: WorkflowOutboxStatus.Pending },
      orderBy: { createdAt: 'asc' },
      take: limit,
    });

    return rows.map((row) => this.toRecord(row as WorkflowOutboxRow));
  }

  async markDispatched(id: string, dispatchedAt?: Date): Promise<void> {
    await this.client.workflowOutbox.update({
      where: { id },
      data: {
        status: WorkflowOutboxStatus.Dispatched,
        dispatchedAt: dispatchedAt ?? new Date(),
        lastError: null,
      },
    });
  }

  async markFailed(id: string, error: string): Promise<void> {
    await this.client.workflowOutbox.update({
      where: { id },
      data: {
        status: WorkflowOutboxStatus.Failed,
        lastError: error,
      },
    });
  }

  private toRecord(row: WorkflowOutboxRow): WorkflowOutboxRecord {
    return {
      id: row.id,
      instanceId: row.instanceId,
      eventType: row.eventType,
      payload: (row.payload ?? {}) as Record<string, unknown>,
      status: row.status as WorkflowOutboxStatus,
      createdAt: row.createdAt,
      dispatchedAt: row.dispatchedAt,
      lastError: row.lastError,
    };
  }
}
