import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ModulesContainer } from '@nestjs/core/injector/modules-container';
import {
  WORKFLOW_TASK_HANDLER_METADATA,
  WorkflowTaskHandlerMetadata,
} from '../../infrastructure/decorators/workflow-task-handler.decorator';
import {
  WORKFLOW_COMPENSATION_HANDLER_METADATA,
  WorkflowCompensationHandlerMetadata,
} from '../../infrastructure/decorators/workflow-compensation-handler.decorator';

export interface WorkflowTaskHandlerContract {
  execute(params: {
    instanceId: string;
    elementId: string;
    input: Record<string, unknown>;
    correlationId?: string;
  }): Promise<Record<string, unknown> | void>;
}

export interface WorkflowCompensationHandlerContract {
  compensate(params: {
    instanceId: string;
    elementId: string;
    input: Record<string, unknown>;
    correlationId?: string;
  }): Promise<void>;
}

@Injectable()
export class TaskHandlerRegistryService implements OnApplicationBootstrap {
  private readonly logger = new Logger(TaskHandlerRegistryService.name);
  private readonly taskHandlers = new Map<string, WorkflowTaskHandlerContract>();
  private readonly compensationHandlers = new Map<string, WorkflowCompensationHandlerContract>();

  constructor(private readonly modulesContainer: ModulesContainer) {}

  onApplicationBootstrap(): void {
    this.discoverHandlers();
  }

  getTaskHandler(name: string): WorkflowTaskHandlerContract | undefined {
    return this.taskHandlers.get(name);
  }

  getCompensationHandler(name: string): WorkflowCompensationHandlerContract | undefined {
    return this.compensationHandlers.get(name);
  }

  getRegisteredTaskHandlers(): string[] {
    return Array.from(this.taskHandlers.keys());
  }

  private discoverHandlers(): void {
    let taskCount = 0;
    let compensationCount = 0;

    for (const module of this.modulesContainer.values()) {
      for (const wrapper of module.providers.values()) {
        if (!wrapper?.instance || typeof wrapper.instance !== 'object') {
          continue;
        }

        const ctor = wrapper.instance.constructor;
        const taskMeta = Reflect.getMetadata(
          WORKFLOW_TASK_HANDLER_METADATA,
          ctor,
        ) as WorkflowTaskHandlerMetadata | undefined;

        if (taskMeta) {
          this.taskHandlers.set(taskMeta.handlerName, wrapper.instance as WorkflowTaskHandlerContract);
          taskCount++;
          this.logger.log(`Registered task handler: ${taskMeta.handlerName}`);
        }

        const compensationMeta = Reflect.getMetadata(
          WORKFLOW_COMPENSATION_HANDLER_METADATA,
          ctor,
        ) as WorkflowCompensationHandlerMetadata | undefined;

        if (compensationMeta) {
          this.compensationHandlers.set(
            compensationMeta.handlerName,
            wrapper.instance as WorkflowCompensationHandlerContract,
          );
          compensationCount++;
          this.logger.log(`Registered compensation handler: ${compensationMeta.handlerName}`);
        }
      }
    }

    this.logger.log(
      `Discovered ${taskCount} task handler(s) and ${compensationCount} compensation handler(s).`,
    );
  }
}
