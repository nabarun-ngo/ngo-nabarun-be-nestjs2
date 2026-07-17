export const WORKFLOW_FORM_DATA_PORT = Symbol('IWorkflowFormDataPort');

export interface WorkflowFormDataSnapshot {
  formKey: string;
  entityType?: string;
  entityId?: string;
  values: Record<string, unknown>;
  submittedAt?: Date;
  submittedById?: string;
}

export interface IWorkflowFormDataPort {
  /**
   * Load persisted form data for a user task, keyed by formKey and workflow context.
   */
  getFormData(params: {
    instanceId: string;
    elementId: string;
    formKey: string;
    entityType?: string;
    entityId?: string;
  }): Promise<WorkflowFormDataSnapshot | null>;

  /**
   * Persist draft or submitted form values for a user task.
   */
  saveFormData(params: {
    instanceId: string;
    elementId: string;
    formKey: string;
    entityType?: string;
    entityId?: string;
    values: Record<string, unknown>;
    submittedById: string;
    submit: boolean;
  }): Promise<WorkflowFormDataSnapshot>;

  /**
   * Validate form values against the form schema without persisting.
   */
  validateFormData(params: {
    formKey: string;
    entityType?: string;
    values: Record<string, unknown>;
  }): Promise<{ valid: boolean; errors?: Record<string, string[]> }>;
}
