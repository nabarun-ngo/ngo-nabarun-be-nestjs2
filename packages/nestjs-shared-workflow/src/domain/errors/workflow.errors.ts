import { BusinessError } from '@nabarun-ngo/nestjs-shared-core';

export class WorkflowDefinitionNotFoundError extends BusinessError {
  constructor(definitionId: string, version?: number) {
    super(
      version != null
        ? `Workflow definition "${definitionId}" v${version} not found.`
        : `Workflow definition "${definitionId}" not found.`,
      'WORKFLOW_DEFINITION_NOT_FOUND',
      404,
    );
  }
}

export class WorkflowDefinitionDraftNotStartableError extends BusinessError {
  constructor(definitionId: string) {
    super(
      `Workflow definition "${definitionId}" is a draft and cannot start instances. Publish it first.`,
      'WORKFLOW_DEFINITION_DRAFT_NOT_STARTABLE',
      422,
    );
  }
}

export class WorkflowInstanceNotFoundError extends BusinessError {
  constructor(instanceId: string) {
    super(`Workflow instance "${instanceId}" not found.`, 'WORKFLOW_INSTANCE_NOT_FOUND', 404);
  }
}

export class WorkflowTaskNotFoundError extends BusinessError {
  constructor(taskId: string) {
    super(`Workflow task "${taskId}" not found.`, 'WORKFLOW_TASK_NOT_FOUND', 404);
  }
}

export class WorkflowInvalidStateError extends BusinessError {
  constructor(message: string) {
    super(message, 'WORKFLOW_INVALID_STATE', 409);
  }
}

export class WorkflowTaskNotClaimableError extends BusinessError {
  constructor(taskId: string) {
    super(`Workflow task "${taskId}" cannot be claimed.`, 'WORKFLOW_TASK_NOT_CLAIMABLE', 409);
  }
}

export class WorkflowTaskNotCompletableError extends BusinessError {
  constructor(taskId: string) {
    super(`Workflow task "${taskId}" cannot be completed.`, 'WORKFLOW_TASK_NOT_COMPLETABLE', 409);
  }
}

export class WorkflowUnauthorizedTaskActionError extends BusinessError {
  constructor(userId: string, taskId: string) {
    super(
      `User "${userId}" is not authorized to act on task "${taskId}".`,
      'WORKFLOW_UNAUTHORIZED_TASK_ACTION',
      403,
    );
  }
}

export class WorkflowElementNotFoundError extends BusinessError {
  constructor(elementId: string) {
    super(`Workflow element "${elementId}" not found.`, 'WORKFLOW_ELEMENT_NOT_FOUND', 404);
  }
}

export class WorkflowNoOutgoingFlowError extends BusinessError {
  constructor(elementId: string) {
    super(
      `No valid outgoing flow from element "${elementId}".`,
      'WORKFLOW_NO_OUTGOING_FLOW',
      422,
    );
  }
}

export class WorkflowServiceTaskHandlerNotFoundError extends BusinessError {
  constructor(handlerName: string) {
    super(
      `No service task handler registered for "${handlerName}".`,
      'WORKFLOW_SERVICE_TASK_HANDLER_NOT_FOUND',
      422,
    );
  }
}

export class WorkflowOptimisticLockError extends BusinessError {
  constructor(instanceId: string) {
    super(
      `Workflow instance "${instanceId}" was modified concurrently. Retry the operation.`,
      'WORKFLOW_OPTIMISTIC_LOCK',
      409,
    );
  }
}

export class WorkflowIdempotencyConflictError extends BusinessError {
  constructor(key: string) {
    super(
      `Idempotency key "${key}" is already in use.`,
      'WORKFLOW_IDEMPOTENCY_CONFLICT',
      409,
    );
  }
}
