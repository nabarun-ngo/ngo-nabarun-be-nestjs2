import { Injectable } from '@nestjs/common';
import {
  BasePrismaService,
  PrismaCrudRepositoryBase,
} from '@ce/nestjs-shared-persistence';
import {
  IWorkflowInstanceRepository,
  WorkflowInstanceFilter,
  WorkflowInstanceRecord,
  WorkflowInstanceStatus,
} from '@ce/nestjs-shared-workflow';
import { Prisma, PrismaClient } from '../prisma/client';
import {
  WorkflowInstanceWhereInput,
  WorkflowInstanceWhereUniqueInput,
  WorkflowInstanceOrderByWithRelationInput,
} from '../prisma/models';

type WorkflowInstanceRow = {
  id: string;
  name: string;
  definitionId: string;
  definitionVersion: number;
  description: string;
  status: string;
  currentElementId: string | null;
  parentInstanceId: string | null;
  context: Prisma.JsonValue;
  compensationStack: Prisma.JsonValue;
  initiatedById: string | null;
  initiatedForId: string | null;
  delegated: boolean;
  isExtUser: boolean;
  extUserEmail: string | null;
  completedAt: Date | null;
  remarks: string | null;
  version: number;
  createdAt: Date;
  updatedAt: Date;
};

const ACTIVE_STATUSES: WorkflowInstanceStatus[] = [
  WorkflowInstanceStatus.Running,
  WorkflowInstanceStatus.Suspended,
  WorkflowInstanceStatus.Compensating,
];

@Injectable()
export class WorkflowInstancePrismaRepository
  extends PrismaCrudRepositoryBase<
    PrismaClient,
    'workflowInstance',
    WorkflowInstanceRecord,
    string,
    WorkflowInstanceFilter,
    WorkflowInstanceRow,
    WorkflowInstanceWhereInput,
    WorkflowInstanceWhereUniqueInput,
    any,
    any,
    WorkflowInstanceOrderByWithRelationInput
  >
  implements IWorkflowInstanceRepository
{
  constructor(database: BasePrismaService<PrismaClient>) {
    super(database, 'workflowInstance');
  }

  async findByIdForUpdate(id: string): Promise<WorkflowInstanceRecord | null> {
    const rows = await this.client.$queryRaw<WorkflowInstanceRow[]>`
      SELECT
        "id", "name", "definitionId", "definitionVersion", "description", "status",
        "currentElementId", "parentInstanceId", "context", "compensationStack",
        "initiatedById", "initiatedForId", "delegated", "isExtUser", "extUserEmail",
        "completedAt", "remarks", "version", "createdAt", "updatedAt"
      FROM "workflow_instances"
      WHERE "id" = ${id}
      FOR UPDATE
    `;

    return rows[0] ? this.toDomain(rows[0]) : null;
  }

  async updateWithVersion(
    id: string,
    expectedVersion: number,
    patch: Partial<
      Pick<
        WorkflowInstanceRecord,
        | 'status'
        | 'currentElementId'
        | 'context'
        | 'compensationStack'
        | 'completedAt'
        | 'remarks'
      >
    >,
  ): Promise<WorkflowInstanceRecord> {
    const data: Prisma.WorkflowInstanceUpdateManyMutationInput = {
      version: expectedVersion + 1,
      updatedAt: new Date(),
    };

    if (patch.status !== undefined) {
      data.status = patch.status;
    }
    if (patch.currentElementId !== undefined) {
      data.currentElementId = patch.currentElementId;
    }
    if (patch.context !== undefined) {
      data.context = patch.context as Prisma.InputJsonValue;
    }
    if (patch.compensationStack !== undefined) {
      data.compensationStack = patch.compensationStack as Prisma.InputJsonValue;
    }
    if (patch.completedAt !== undefined) {
      data.completedAt = patch.completedAt;
    }
    if (patch.remarks !== undefined) {
      data.remarks = patch.remarks;
    }

    const result = await this.client.workflowInstance.updateMany({
      where: { id, version: expectedVersion },
      data,
    });

    if (result.count === 0) {
      throw new Error(`Workflow instance ${id} optimistic lock conflict`);
    }

    const updated = await this.findById(id);
    return updated!;
  }

  async findActiveByInitiatedFor(initiatedForId: string): Promise<WorkflowInstanceRecord[]> {
    const rows = await this.client.workflowInstance.findMany({
      where: {
        initiatedForId,
        status: { in: ACTIVE_STATUSES },
      },
      orderBy: { createdAt: 'desc' },
    });

    return rows.map((row) => this.toDomain(row as WorkflowInstanceRow));
  }

  protected toDomain(row: WorkflowInstanceRow): WorkflowInstanceRecord {
    return {
      id: row.id,
      name: row.name,
      definitionId: row.definitionId,
      definitionVersion: row.definitionVersion,
      description: row.description,
      status: row.status as WorkflowInstanceStatus,
      currentElementId: row.currentElementId,
      parentInstanceId: row.parentInstanceId,
      context: (row.context ?? {}) as Record<string, unknown>,
      compensationStack: (row.compensationStack ?? []) as unknown[],
      initiatedById: row.initiatedById,
      initiatedForId: row.initiatedForId,
      delegated: row.delegated,
      isExtUser: row.isExtUser,
      extUserEmail: row.extUserEmail,
      completedAt: row.completedAt,
      remarks: row.remarks,
      version: row.version,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  protected toCreateInput(entity: WorkflowInstanceRecord): any {
    return {
      id: entity.id,
      name: entity.name,
      definitionId: entity.definitionId,
      definitionVersion: entity.definitionVersion,
      description: entity.description,
      status: entity.status,
      currentElementId: entity.currentElementId,
      parentInstanceId: entity.parentInstanceId,
      context: entity.context as Prisma.InputJsonValue,
      compensationStack: entity.compensationStack as Prisma.InputJsonValue,
      initiatedById: entity.initiatedById,
      initiatedForId: entity.initiatedForId,
      delegated: entity.delegated,
      isExtUser: entity.isExtUser,
      extUserEmail: entity.extUserEmail,
      completedAt: entity.completedAt,
      remarks: entity.remarks,
      version: entity.version,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  protected toUpdateInput(_id: string, entity: WorkflowInstanceRecord): any {
    return {
      name: entity.name,
      description: entity.description,
      status: entity.status,
      currentElementId: entity.currentElementId,
      parentInstanceId: entity.parentInstanceId,
      context: entity.context as Prisma.InputJsonValue,
      compensationStack: entity.compensationStack as Prisma.InputJsonValue,
      initiatedById: entity.initiatedById,
      initiatedForId: entity.initiatedForId,
      delegated: entity.delegated,
      isExtUser: entity.isExtUser,
      extUserEmail: entity.extUserEmail,
      completedAt: entity.completedAt,
      remarks: entity.remarks,
      version: entity.version,
      updatedAt: entity.updatedAt,
    };
  }

  protected toUniqueWhere(id: string): WorkflowInstanceWhereUniqueInput {
    return { id };
  }

  protected toFilterWhere(filter?: WorkflowInstanceFilter): WorkflowInstanceWhereInput {
    return {
      ...(filter?.definitionId ? { definitionId: filter.definitionId } : {}),
      ...(filter?.status ? { status: filter.status } : {}),
      ...(filter?.initiatedForId ? { initiatedForId: filter.initiatedForId } : {}),
      ...(filter?.parentInstanceId ? { parentInstanceId: filter.parentInstanceId } : {}),
    };
  }

  protected defaultOrderBy(): WorkflowInstanceOrderByWithRelationInput {
    return { createdAt: 'desc' };
  }
}
