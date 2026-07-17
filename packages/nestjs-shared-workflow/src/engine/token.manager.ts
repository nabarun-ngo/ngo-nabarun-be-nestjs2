import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  CreateWorkflowTokenInput,
  IWorkflowTokenRepository,
  WorkflowTokenRecord,
  WorkflowTokenStatus,
} from '../domain/ports/workflow-token.repository';

@Injectable()
export class TokenManager {
  constructor(
    @Inject(IWorkflowTokenRepository)
    private readonly tokenRepo: IWorkflowTokenRepository,
  ) {}

  async fork(
    instanceId: string,
    parentGatewayId: string,
    targetElementIds: string[],
  ): Promise<WorkflowTokenRecord[]> {
    const inputs: CreateWorkflowTokenInput[] = targetElementIds.map((elementId) => ({
      instanceId,
      branchId: randomUUID(),
      parentGatewayId,
      currentElementId: elementId,
      status: WorkflowTokenStatus.Active,
    }));
    return this.tokenRepo.createMany(inputs);
  }

  async moveToken(
    token: WorkflowTokenRecord,
    elementId: string,
    status: WorkflowTokenStatus = WorkflowTokenStatus.Active,
  ): Promise<WorkflowTokenRecord> {
    return this.tokenRepo.moveToken(token.id, elementId, status);
  }

  async markWaiting(token: WorkflowTokenRecord): Promise<WorkflowTokenRecord> {
    return this.tokenRepo.moveToken(token.id, token.currentElementId, WorkflowTokenStatus.Waiting);
  }

  async consume(token: WorkflowTokenRecord): Promise<WorkflowTokenRecord> {
    return this.tokenRepo.consumeToken(token.id);
  }

  async cancelAll(instanceId: string): Promise<number> {
    return this.tokenRepo.cancelByInstance(instanceId);
  }

  async getActiveTokens(instanceId: string): Promise<WorkflowTokenRecord[]> {
    return this.tokenRepo.findActiveByInstance(instanceId);
  }

  /**
   * Returns true when every active token for the join gateway has arrived.
   */
  async isJoinComplete(
    instanceId: string,
    joinGatewayId: string,
    expectedBranchCount: number,
  ): Promise<boolean> {
    const tokens = await this.tokenRepo.findActiveByInstance(instanceId);
    const atJoin = tokens.filter(
      (t) =>
        t.parentGatewayId === joinGatewayId &&
        t.currentElementId === joinGatewayId &&
        (t.status === WorkflowTokenStatus.Active || t.status === WorkflowTokenStatus.Waiting),
    );
    return atJoin.length >= expectedBranchCount;
  }

  async getTokensAtElement(
    instanceId: string,
    elementId: string,
  ): Promise<WorkflowTokenRecord[]> {
    const tokens = await this.tokenRepo.findActiveByInstance(instanceId);
    return tokens.filter((t) => t.currentElementId === elementId);
  }
}
