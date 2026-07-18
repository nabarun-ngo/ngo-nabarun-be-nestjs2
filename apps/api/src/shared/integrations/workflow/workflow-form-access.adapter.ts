import { Inject, Injectable } from '@nestjs/common';
import { BasePrismaService } from '@nabarun-ngo/nestjs-shared-persistence';
import {
  FormEntityAccessAction,
  IFormEntityAccessPort,
  IFormRepository,
} from '@nabarun-ngo/nestjs-shared-custom-forms';

const WORKFLOW_ENTITY_TYPE = 'workflow';
const ADMIN_WORKFLOWS_PERMISSION = 'admin:workflows';
const READ_WORKFLOW_PERMISSION = 'read:workflow';
const UPDATE_TASK_PERMISSION = 'update:task';
const UPDATE_WORKFLOW_PERMISSION = 'update:workflow';

@Injectable()
export class WorkflowFormAccessAdapter implements IFormEntityAccessPort {
  constructor(
    @Inject(IFormRepository)
    private readonly formRepo: IFormRepository,
    private readonly prisma: BasePrismaService,
  ) { }

  async canAccess(params: {
    formId: string;
    entityId?: string;
    userId: string;
    userPermissions: string[];
    action: FormEntityAccessAction;
  }): Promise<boolean> {
    const form = await this.formRepo.findById(params.formId);
    if (!form || form.entityType !== WORKFLOW_ENTITY_TYPE) {
      return true;
    }

    if (params.action === 'manage') {
      return params.userPermissions.includes(ADMIN_WORKFLOWS_PERMISSION);
    }

    if (!params.entityId) {
      return false;
    }

    const instance = await this.prisma.workflowInstance.findUnique({
      where: { id: params.entityId },
      select: { initiatedById: true, initiatedForId: true },
    });

    if (instance) {
      if (
        params.userId === instance.initiatedById ||
        params.userId === instance.initiatedForId
      ) {
        return true;
      }

      if (params.userPermissions.includes(READ_WORKFLOW_PERMISSION)) {
        return (
          params.action === 'read' ||
          params.userPermissions.includes(UPDATE_WORKFLOW_PERMISSION)
        );
      }

      return false;
    }

    const separatorIndex = params.entityId.indexOf(':');
    if (separatorIndex <= 0) {
      return false;
    }

    const instanceId = params.entityId.slice(0, separatorIndex);
    const elementId = params.entityId.slice(separatorIndex + 1);

    const inbox = await this.prisma.workflowTaskInbox.findUnique({
      where: {
        instanceId_elementId: { instanceId, elementId },
      },
      select: {
        assignedToId: true,
        claimedById: true,
      },
    });

    if (!inbox) {
      return false;
    }

    if (
      inbox.assignedToId === params.userId &&
      inbox.claimedById === params.userId
    ) {
      return true;
    }

    return params.userPermissions.includes(UPDATE_TASK_PERMISSION);
  }
}

export const WORKFLOW_FORM_ACCESS_PROVIDER = {
  provide: IFormEntityAccessPort,
  useClass: WorkflowFormAccessAdapter,
};
