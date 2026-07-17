import {
  WorkflowDefinition,
  WorkflowDefinitionSchema,
} from '../../dsl/workflow-definition.schema';

export const WORKFLOW_DEFINITION_PORT = Symbol('IWorkflowDefinitionPort');

export interface IWorkflowDefinitionPort {
  /**
   * Load a published workflow definition by id and optional version.
   * When version is omitted, returns the latest published version.
   */
  getDefinition(
    definitionId: string,
    version?: number,
  ): Promise<WorkflowDefinition | null>;

  /**
   * Parse and validate a raw definition payload without persisting it.
   */
  validateDefinition(input: unknown): WorkflowDefinition;

  /**
   * List all published versions for a definition id, newest first.
   */
  listVersions(definitionId: string): Promise<number[]>;

  /**
   * Validate and persist a published definition (latest pointer + immutable version key).
   */
  publishDefinition(input: unknown): Promise<WorkflowDefinition>;
}

/** Convenience helper for adapters that store definitions as JSON. */
export function parseStoredWorkflowDefinition(input: unknown): WorkflowDefinition {
  return WorkflowDefinitionSchema.parse(input);
}
