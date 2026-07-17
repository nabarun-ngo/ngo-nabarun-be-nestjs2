import { Injectable, SetMetadata } from '@nestjs/common';

export const WORKFLOW_COMPENSATION_HANDLER_METADATA = 'workflow_compensation_handler_metadata';

export interface WorkflowCompensationHandlerMetadata {
  handlerName: string;
}

/**
 * Marks a class as a workflow compensation handler for saga rollbacks.
 */
export const WorkflowCompensationHandler = (handlerName: string): ClassDecorator => {
  return (target: Function) => {
    Injectable()(target);
    SetMetadata(
      WORKFLOW_COMPENSATION_HANDLER_METADATA,
      { handlerName } satisfies WorkflowCompensationHandlerMetadata,
    )(target);
  };
};
