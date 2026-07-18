import { WorkflowFacade, WorkflowRequesterType } from '@ce/nestjs-shared-workflow';
import { StartPublicWorkflowService } from './start-public-workflow.service';

describe('StartPublicWorkflowService', () => {
  it('starts external workflow and persists request form data without field extraction', async () => {
    const workflowFacade = {
      startWorkflow: jest.fn().mockResolvedValue({ id: 'wf-instance-1' }),
    } as unknown as WorkflowFacade;

    const formDataPort = {
      saveFormData: jest.fn().mockResolvedValue(undefined),
    };

    const service = new StartPublicWorkflowService(workflowFacade, formDataPort as never);

    const values = { email: 'user@example.com', message: 'Hello' };
    const instanceId = await service.startFromPublicSubmission({
      publicFormId: 'contact',
      alias: {
        definitionId: 'CONTACT_REQUEST',
        formKey: 'CONTACT_REQUEST:request',
        entityType: 'workflow',
      },
      values,
      submissionId: 'sub-123',
    });

    expect(instanceId).toBe('wf-instance-1');
    expect(workflowFacade.startWorkflow).toHaveBeenCalledWith({
      definitionId: 'CONTACT_REQUEST',
      requester: { type: WorkflowRequesterType.External, id: null },
      context: { ...values, definitionId: 'CONTACT_REQUEST' },
      idempotencyKey: 'public:contact:sub-123',
    });
    expect(formDataPort.saveFormData).toHaveBeenCalledWith({
      instanceId: 'wf-instance-1',
      elementId: 'start',
      formKey: 'CONTACT_REQUEST:request',
      values,
      submittedById: 'public:anonymous',
      submit: true,
    });
  });
});
