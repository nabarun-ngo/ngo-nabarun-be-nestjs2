import { Inject, Injectable } from '@nestjs/common';
import { WORKFLOW_OPTIONS } from '../infrastructure/workflow-options.token';
import type { WorkflowModuleOptions } from '../workflow.schema';
import {
  IWorkflowIdempotencyRepository,
  WorkflowIdempotencyRecord,
  WorkflowIdempotencyScope,
} from '../domain/ports/workflow-idempotency.repository';
import { WorkflowIdempotencyConflictError } from '../domain/errors/workflow.errors';

@Injectable()
export class IdempotencyService {
  constructor(
    @Inject(IWorkflowIdempotencyRepository)
    private readonly idempotencyRepo: IWorkflowIdempotencyRepository,
    @Inject(WORKFLOW_OPTIONS)
    private readonly options: WorkflowModuleOptions,
  ) {}

  async claim(params: {
    key: string;
    scope: WorkflowIdempotencyScope;
    instanceId?: string | null;
    ttlMs?: number;
  }): Promise<{ claimed: boolean; record: WorkflowIdempotencyRecord }> {
    return this.idempotencyRepo.claim({
      key: params.key,
      scope: params.scope,
      instanceId: params.instanceId,
      ttlMs: params.ttlMs ?? this.options.idempotencyTtlMs,
    });
  }

  async complete(key: string, result: Record<string, unknown>): Promise<WorkflowIdempotencyRecord> {
    return this.idempotencyRepo.complete(key, result);
  }

  async findByKey(key: string): Promise<WorkflowIdempotencyRecord | null> {
    return this.idempotencyRepo.findByKey(key);
  }

  async requireFreshClaim(params: {
    key: string;
    scope: WorkflowIdempotencyScope;
    instanceId?: string | null;
  }): Promise<void> {
    const { claimed, record } = await this.claim(params);
    if (!claimed && record.result) {
      return;
    }
    if (!claimed && !record.result) {
      throw new WorkflowIdempotencyConflictError(params.key);
    }
  }
}
