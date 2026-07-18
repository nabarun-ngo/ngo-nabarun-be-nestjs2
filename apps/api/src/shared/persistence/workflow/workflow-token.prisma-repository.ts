import { Injectable } from '@nestjs/common';
import { BasePrismaService } from '@nabarun-ngo/nestjs-shared-persistence';
import {
  CreateWorkflowTokenInput,
  IWorkflowTokenRepository,
  WorkflowTokenRecord,
  WorkflowTokenStatus,
} from '@nabarun-ngo/nestjs-shared-workflow';
import { PrismaClient } from '../prisma/client';

type WorkflowTokenRow = {
  id: string;
  instanceId: string;
  branchId: string;
  parentGatewayId: string;
  status: string;
  currentElementId: string;
  createdAt: Date;
  updatedAt: Date;
};

const ACTIVE_STATUSES: WorkflowTokenStatus[] = [
  WorkflowTokenStatus.Active,
  WorkflowTokenStatus.Waiting,
];

@Injectable()
export class WorkflowTokenPrismaRepository implements IWorkflowTokenRepository {
  constructor(private readonly database: BasePrismaService<PrismaClient>) { }

  private get client(): PrismaClient {
    return this.database.client;
  }

  async create(input: CreateWorkflowTokenInput): Promise<WorkflowTokenRecord> {
    const [record] = await this.createMany([input]);
    return record;
  }

  async createMany(inputs: CreateWorkflowTokenInput[]): Promise<WorkflowTokenRecord[]> {
    if (inputs.length === 0) {
      return [];
    }

    const now = new Date();
    const rows = await this.client.$transaction(
      inputs.map((input) =>
        this.client.workflowToken.create({
          data: {
            instanceId: input.instanceId,
            branchId: input.branchId,
            parentGatewayId: input.parentGatewayId,
            currentElementId: input.currentElementId,
            status: input.status ?? WorkflowTokenStatus.Active,
            createdAt: now,
            updatedAt: now,
          },
        }),
      ),
    );

    return rows.map((row) => this.toRecord(row as WorkflowTokenRow));
  }

  async findById(id: string): Promise<WorkflowTokenRecord | null> {
    const row = await this.client.workflowToken.findUnique({ where: { id } });
    return row ? this.toRecord(row as WorkflowTokenRow) : null;
  }

  async findActiveByInstance(instanceId: string): Promise<WorkflowTokenRecord[]> {
    const rows = await this.client.workflowToken.findMany({
      where: {
        instanceId,
        status: { in: ACTIVE_STATUSES },
      },
      orderBy: { createdAt: 'asc' },
    });

    return rows.map((row) => this.toRecord(row as WorkflowTokenRow));
  }

  async findByInstanceAndBranch(
    instanceId: string,
    branchId: string,
  ): Promise<WorkflowTokenRecord[]> {
    const rows = await this.client.workflowToken.findMany({
      where: { instanceId, branchId },
      orderBy: { createdAt: 'asc' },
    });

    return rows.map((row) => this.toRecord(row as WorkflowTokenRow));
  }

  async moveToken(
    id: string,
    currentElementId: string,
    status?: WorkflowTokenStatus,
  ): Promise<WorkflowTokenRecord> {
    const row = await this.client.workflowToken.update({
      where: { id },
      data: {
        currentElementId,
        ...(status ? { status } : {}),
        updatedAt: new Date(),
      },
    });

    return this.toRecord(row as WorkflowTokenRow);
  }

  async consumeToken(id: string): Promise<WorkflowTokenRecord> {
    const row = await this.client.workflowToken.update({
      where: { id },
      data: {
        status: WorkflowTokenStatus.Consumed,
        updatedAt: new Date(),
      },
    });

    return this.toRecord(row as WorkflowTokenRow);
  }

  async cancelByInstance(instanceId: string): Promise<number> {
    const result = await this.client.workflowToken.updateMany({
      where: {
        instanceId,
        status: { in: ACTIVE_STATUSES },
      },
      data: {
        status: WorkflowTokenStatus.Cancelled,
        updatedAt: new Date(),
      },
    });

    return result.count;
  }

  private toRecord(row: WorkflowTokenRow): WorkflowTokenRecord {
    return {
      id: row.id,
      instanceId: row.instanceId,
      branchId: row.branchId,
      parentGatewayId: row.parentGatewayId,
      status: row.status as WorkflowTokenStatus,
      currentElementId: row.currentElementId,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
