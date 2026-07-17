import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import { Parser } from 'expr-eval';
import { IUserRolePort } from '@ce/nestjs-shared-auth';
import { IUserLookupPort } from '@ce/nestjs-shared-core';
import {
  IWorkflowUserResolutionPort,
  ResolvedWorkflowAssignee,
  WORKFLOW_USER_RESOLUTION_PORT,
} from '@ce/nestjs-shared-workflow';

@Injectable()
export class WorkflowUserResolutionAdapter implements IWorkflowUserResolutionPort {
  private readonly logger = new Logger(WorkflowUserResolutionAdapter.name);

  constructor(
    @Optional() @Inject(IUserRolePort) private readonly userRole: IUserRolePort | null,
    @Optional() @Inject(IUserLookupPort) private readonly userLookup: IUserLookupPort | null,
  ) {}

  async resolveCandidates(params: {
    roleNames: string[];
    instanceId: string;
    elementId: string;
    context: Record<string, unknown>;
  }): Promise<ResolvedWorkflowAssignee[]> {
    if (!this.userRole || !this.userLookup) {
      this.logger.warn(
        'resolveCandidates: IUserRolePort or IUserLookupPort not registered',
      );
      return [];
    }

    const assignees: ResolvedWorkflowAssignee[] = [];
    const seen = new Set<string>();

    for (const roleName of params.roleNames) {
      const idpSubs = await this.userRole.findIdPSubsByRole(roleName);
      if (!idpSubs.length) continue;

      const users = await this.userLookup.findByIdPSubs(idpSubs);
      for (const user of users) {
        if (seen.has(user.id)) continue;
        seen.add(user.id);
        assignees.push({
          userId: user.id,
          displayName: user.fullName,
          email: user.email,
        });
      }
    }

    return assignees;
  }

  async resolveAssigneeExpression(params: {
    expression: string;
    instanceId: string;
    elementId: string;
    context: Record<string, unknown>;
  }): Promise<ResolvedWorkflowAssignee | null> {
    if (!this.userLookup) {
      this.logger.warn('resolveAssigneeExpression: IUserLookupPort not registered');
      return null;
    }

    let resolved: unknown;
    try {
      const parser = new Parser();
      resolved = parser.evaluate(params.expression, params.context as never);
    } catch (error) {
      this.logger.warn(
        `resolveAssigneeExpression failed for "${params.expression}": ${(error as Error).message}`,
      );
      return null;
    }

    if (typeof resolved !== 'string' || !resolved) {
      return null;
    }

    const user = await this.userLookup.findById(resolved);
    if (!user) return null;

    return {
      userId: user.id,
      displayName: user.fullName,
      email: user.email,
    };
  }

  async canUserActOnTask(params: {
    userId: string;
    userPermissions: string[];
    instanceId: string;
    elementId: string;
    assignedToId?: string | null;
    candidateRoleNames: string[];
  }): Promise<boolean> {
    if (params.assignedToId && params.assignedToId === params.userId) {
      return true;
    }

    if (params.userPermissions.includes('update:task')) {
      return true;
    }

    if (!this.userRole || !this.userLookup) {
      return false;
    }

    const user = await this.userLookup.findById(params.userId);
    if (!user?.idpSub) return false;

    for (const roleName of params.candidateRoleNames) {
      const idpSubs = await this.userRole.findIdPSubsByRole(roleName);
      if (idpSubs.includes(user.idpSub)) {
        return true;
      }
    }

    return false;
  }
}

export const WORKFLOW_USER_RESOLUTION_PROVIDER = {
  provide: WORKFLOW_USER_RESOLUTION_PORT,
  useClass: WorkflowUserResolutionAdapter,
};
