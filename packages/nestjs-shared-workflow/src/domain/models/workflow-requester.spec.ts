import {
  WorkflowRequesterType,
  resolveWorkflowRequester,
} from './workflow-requester';

describe('resolveWorkflowRequester', () => {
  it('marks external requesters as ext users with no initiator id', () => {
    const resolved = resolveWorkflowRequester({
      requester: { type: WorkflowRequesterType.External, id: null },
    });

    expect(resolved.isExtUser).toBe(true);
    expect(resolved.initiatedById).toBeNull();
    expect(resolved.extUserEmail).toBeNull();
  });

  it('uses contactRef as extUserEmail for external requesters', () => {
    const resolved = resolveWorkflowRequester({
      requester: {
        type: WorkflowRequesterType.External,
        id: null,
        contactRef: 'user@example.com',
      },
    });

    expect(resolved.extUserEmail).toBe('user@example.com');
  });

  it('resolves internal requesters from explicit requester id', () => {
    const resolved = resolveWorkflowRequester({
      requester: { type: WorkflowRequesterType.Internal, id: 'user-1' },
    });

    expect(resolved.isExtUser).toBe(false);
    expect(resolved.initiatedById).toBe('user-1');
  });

  it('defaults to external when no requester or initiator is provided', () => {
    const resolved = resolveWorkflowRequester({});

    expect(resolved.requesterType).toBe(WorkflowRequesterType.External);
    expect(resolved.isExtUser).toBe(true);
    expect(resolved.initiatedById).toBeNull();
  });
});
