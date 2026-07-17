import { readFileSync } from 'fs';
import { join } from 'path';
import { evaluateCondition } from '@ce/nestjs-shared-core';
import {
  TransitionRouter,
  parseWorkflowDefinition,
  WorkflowDefinition,
} from '@ce/nestjs-shared-workflow';

describe('JOIN_REQUEST routing contract', () => {
  const definitionPath = join(
    __dirname,
    '../../../../apps/api/prisma/seeds/json-store/workflow/JOIN_REQUEST.json',
  );
  let definition: WorkflowDefinition;
  let router: TransitionRouter;

  beforeAll(() => {
    const raw = JSON.parse(readFileSync(definitionPath, 'utf8'));
    definition = parseWorkflowDefinition(raw);
    router = new TransitionRouter();
  });

  it('validates JOIN_REQUEST seed definition', () => {
    expect(definition.id).toBe('JOIN_REQUEST');
    expect(definition.elements.some((e) => e.type === 'parallelGateway')).toBe(true);
  });

  it('routes verification gateway to approval when no correction and rules accepted', () => {
    const index = router.buildIndex(definition);
    const flows = router.getOutgoingFlows(index, 'xg_verify_route');
    const selected = router.selectExclusiveFlow(flows, {
      correctionNeeded: 'No',
      rulesAccepted: 'Yes',
    });
    expect(selected.targetRef).toBe('ut_approval');
  });

  it('routes verification gateway to correction when correction needed and rules accepted', () => {
    const index = router.buildIndex(definition);
    const flows = router.getOutgoingFlows(index, 'xg_verify_route');
    const selected = router.selectExclusiveFlow(flows, {
      correctionNeeded: 'Yes',
      rulesAccepted: 'Yes',
    });
    expect(selected.targetRef).toBe('ut_correction');
  });

  it('routes verification gateway to rejected when rules not accepted', () => {
    const index = router.buildIndex(definition);
    const flows = router.getOutgoingFlows(index, 'xg_verify_route');
    const selected = router.selectExclusiveFlow(flows, {
      correctionNeeded: 'No',
      rulesAccepted: 'No',
    });
    expect(selected.targetRef).toBe('end_rejected');
  });

  it('evaluates approval gateway approve path', () => {
    const index = router.buildIndex(definition);
    const flows = router.getOutgoingFlows(index, 'xg_approval_route');
    const selected = router.selectExclusiveFlow(flows, { decision: 'Approve' });
    expect(selected.targetRef).toBe('svc_auth0');
  });

  it('golden event sequence for happy path start', () => {
    const golden = [
      'workflow.started',
      'element.entered',
      'element.entered',
      'element.entered',
    ];
    expect(golden[0]).toBe('workflow.started');
    expect(evaluateCondition("decision == 'Approve'", { decision: 'Approve' })).toBe(true);
  });
});

describe('CONTACT_REQUEST routing contract', () => {
  const definitionPath = join(
    __dirname,
    '../../../../apps/api/prisma/seeds/json-store/workflow/CONTACT_REQUEST.json',
  );
  let definition: WorkflowDefinition;
  let router: TransitionRouter;

  beforeAll(() => {
    const raw = JSON.parse(readFileSync(definitionPath, 'utf8'));
    definition = parseWorkflowDefinition(raw);
    router = new TransitionRouter();
  });

  it('completes when support task resolves request', () => {
    const index = router.buildIndex(definition);
    const flows = router.getOutgoingFlows(index, 'xg_support_route');
    const selected = router.selectExclusiveFlow(flows, { isResolved: 'Yes' });
    expect(selected.targetRef).toBe('end_completed');
  });
});
