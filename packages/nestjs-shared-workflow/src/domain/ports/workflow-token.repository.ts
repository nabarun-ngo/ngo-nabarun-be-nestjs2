export enum WorkflowTokenStatus {
  Active = 'active',
  Waiting = 'waiting',
  Consumed = 'consumed',
  Cancelled = 'cancelled',
}

export interface WorkflowTokenRecord {
  id: string;
  instanceId: string;
  branchId: string;
  parentGatewayId: string;
  status: WorkflowTokenStatus;
  currentElementId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateWorkflowTokenInput {
  instanceId: string;
  branchId: string;
  parentGatewayId: string;
  currentElementId: string;
  status?: WorkflowTokenStatus;
}

export interface WorkflowTokenFilter {
  instanceId?: string;
  status?: WorkflowTokenStatus;
  branchId?: string;
}

export const IWorkflowTokenRepository = Symbol('IWorkflowTokenRepository');

export interface IWorkflowTokenRepository {
  create(input: CreateWorkflowTokenInput): Promise<WorkflowTokenRecord>;

  createMany(inputs: CreateWorkflowTokenInput[]): Promise<WorkflowTokenRecord[]>;

  findById(id: string): Promise<WorkflowTokenRecord | null>;

  findActiveByInstance(instanceId: string): Promise<WorkflowTokenRecord[]>;

  findByInstanceAndBranch(
    instanceId: string,
    branchId: string,
  ): Promise<WorkflowTokenRecord[]>;

  moveToken(
    id: string,
    currentElementId: string,
    status?: WorkflowTokenStatus,
  ): Promise<WorkflowTokenRecord>;

  consumeToken(id: string): Promise<WorkflowTokenRecord>;

  cancelByInstance(instanceId: string): Promise<number>;
}
