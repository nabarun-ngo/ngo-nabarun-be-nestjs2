import { Injectable, SetMetadata } from '@nestjs/common';

export const WORKFLOW_TASK_HANDLER_METADATA = 'workflow_task_handler_metadata';

export interface WorkflowTaskHandlerMetadata {
  handlerName: string;
}

/**
 * Marks a class as a workflow service-task handler.
 */
export const WorkflowTaskHandler = (handlerName: string): ClassDecorator => {
  return (target: Function) => {
    Injectable()(target);
    SetMetadata(WORKFLOW_TASK_HANDLER_METADATA, { handlerName } satisfies WorkflowTaskHandlerMetadata)(
      target,
    );
  };
};
