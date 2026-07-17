import { readFileSync } from 'fs';
import { join } from 'path';
import { parseWorkflowDefinition } from '@ce/nestjs-shared-workflow';

const WORKFLOW_SEED_DIR = join(
  __dirname,
  '../../../../apps/api/prisma/seeds/json-store/workflow',
);

const EXPECTED_WORKFLOWS = [
  'JOIN_REQUEST',
  'CONTACT_REQUEST',
  'DONATION_REQUEST',
  'DONATION_PAUSE_REQUEST',
  'DONATION_AMT_CHANGE_REQUEST',
  'TERMINATION_REQUEST',
  'ACCOUNT_ADJUSTMENT',
  'SOCIAL_MEDIA_CAMPAIGN',
  'SOCIAL_MEDIA_CAMPAIGN_CRON_UPDATE',
  'REPORT_REVIEW',
];

describe('workflow seed definitions', () => {
  it.each(EXPECTED_WORKFLOWS)('parses %s seed definition', (workflowId) => {
    const raw = JSON.parse(
      readFileSync(join(WORKFLOW_SEED_DIR, `${workflowId}.json`), 'utf8'),
    );
    const definition = parseWorkflowDefinition(raw);
    expect(definition.id).toBe(workflowId);
    expect(definition.elements.some((e) => e.type === 'startEvent')).toBe(true);
    expect(definition.elements.some((e) => e.type === 'endEvent')).toBe(true);
  });
});
