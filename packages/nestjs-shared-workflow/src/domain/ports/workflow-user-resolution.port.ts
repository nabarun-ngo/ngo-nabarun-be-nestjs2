export const WORKFLOW_USER_RESOLUTION_PORT = Symbol('IWorkflowUserResolutionPort');

export interface ResolvedWorkflowAssignee {
  userId: string;
  displayName?: string;
  email?: string;
}

export interface IWorkflowUserResolutionPort {
  /**
   * Resolve candidate role names to concrete user ids eligible for assignment.
   */
  resolveCandidates(params: {
    roleNames: string[];
    instanceId: string;
    elementId: string;
    context: Record<string, unknown>;
  }): Promise<ResolvedWorkflowAssignee[]>;

  /**
   * Evaluate an assignee expression against workflow context.
   * Returns null when the expression does not resolve to a user.
   */
  resolveAssigneeExpression(params: {
    expression: string;
    instanceId: string;
    elementId: string;
    context: Record<string, unknown>;
  }): Promise<ResolvedWorkflowAssignee | null>;

  /**
   * Verify that a user may act on a workflow task (claim/complete).
   */
  canUserActOnTask(params: {
    userId: string;
    userPermissions: string[];
    instanceId: string;
    elementId: string;
    assignedToId?: string | null;
    candidateRoleNames: string[];
  }): Promise<boolean>;
}
