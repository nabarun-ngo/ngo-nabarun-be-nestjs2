import type { StartWorkflowParams } from '../../services/workflow-orchestrator.service';

export class StartWorkflowCommand {
  constructor(public readonly params: StartWorkflowParams) {}
}