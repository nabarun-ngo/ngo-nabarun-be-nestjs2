export enum WorkflowRequesterType {
  Internal = 'internal',
  External = 'external',
}

export interface WorkflowRequester {
  type: WorkflowRequesterType;
  id?: string | null;
  contactRef?: string | null;
}

export function resolveWorkflowRequester(params: {
  requester?: WorkflowRequester;
  initiatedById?: string | null;
}): {
  requesterType: WorkflowRequesterType;
  initiatedById: string | null;
  isExtUser: boolean;
  extUserEmail: string | null;
} {
  const requester =
    params.requester ??
    (params.initiatedById
      ? { type: WorkflowRequesterType.Internal, id: params.initiatedById }
      : { type: WorkflowRequesterType.External, id: null });

  const isExternal = requester.type === WorkflowRequesterType.External;

  return {
    requesterType: requester.type,
    initiatedById: isExternal ? null : (requester.id ?? params.initiatedById ?? null),
    isExtUser: isExternal,
    extUserEmail: requester.contactRef ?? null,
  };
}
