/**
 * One-time seed-only utility: converts stage workflow templates (step/task JSON)
 * into BPMN-lite DSL documents for JsonStore `workflow` namespace.
 *
 * Usage:
 *   npx ts-node -r tsconfig-paths/register apps/api/scripts/workflow/migrate-stage-templates.ts \
 *     --input C:/path/to/be-nestjs-stage/src/modules/workflow/infrastructure/templates \
 *     --output apps/api/prisma/seeds/json-store/workflow \
 *     --forms-output apps/api/prisma/seeds/workflow-forms.generated.json \
 *     --skip JOIN_REQUEST,CONTACT_REQUEST
 */
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'fs';
import { basename, join } from 'path';
import { parseWorkflowDefinition, WorkflowDefinition } from '@nabarun-ngo/nestjs-shared-workflow';

interface StageField {
  key: string;
  defKey?: string;
  label?: string;
  mandatory?: boolean;
}

interface StageTask {
  taskId: string;
  name?: string;
  type: string;
  handler?: string;
  etaHours?: number;
  taskDetail?: {
    assignedTo?: { roleNames?: string[] | string };
    fields?: StageField[];
  };
}

interface StageStep {
  stepId: string;
  name?: string;
  tasks?: StageTask[];
  transitions?: Array<{ condition: string; nextStepId: string | null }>;
}

interface StageTemplate {
  name: string;
  description?: string;
  fields?: StageField[];
  preCreationTasks?: Array<{ taskId: string; handler: string; name?: string }>;
  steps?: StageStep[];
}

export interface GeneratedFormSeed {
  key: string;
  label: string;
  fields: Array<{
    key: string;
    label: string;
    fieldType: string;
    mandatory?: boolean;
    options?: string[];
    sortOrder: number;
  }>;
}

const ROLE_ALIASES: Record<string, string> = {
  GROUP_COORDINATOR: 'SECRETARY',
  ASST_GROUP_COORDINATOR: 'ASSISTANT_SECRETARY',
  ASST_SECRETARY: 'ASSISTANT_SECRETARY',
  CASHIER: 'TREASURER',
  ASSISTANT_CASHIER: 'TREASURER',
  TECHNICAL_SPECIALIST: 'TECH_ADMIN',
  COMMUNITY_MANAGER: 'SECRETARY',
  ASST_COMMUNITY_MANAGER: 'ASSISTANT_SECRETARY',
};

const SKIP_FILES = new Set(['workflow-schema.json']);

function slug(id: string): string {
  return id.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
}

function normalizeRoles(roleNames?: string[] | string): string[] {
  if (!roleNames) return [];
  if (typeof roleNames === 'string') {
    if (roleNames.includes('{{')) {
      return ['PRESIDENT', 'VICE_PRESIDENT', 'SECRETARY', 'TREASURER'];
    }
    return [roleNames];
  }
  const normalized = roleNames.map((r) => ROLE_ALIASES[r] ?? r);
  return [...new Set(normalized)];
}

function mapCondition(stageCondition: string): string | undefined {
  if (stageCondition === 'default') return undefined;
  return stageCondition.replace(/step_[a-z0-9_]+_task_[a-z0-9_]+\./gi, '');
}

function mapFieldType(defKey?: string): { fieldType: string; options?: string[] } {
  switch (defKey) {
    case 'INPUT_NUMBER_FIELD':
      return { fieldType: 'number' };
    case 'INPUT_DATE_FIELD':
      return { fieldType: 'date' };
    case 'SELECT_YES_NO_FIELD':
      return { fieldType: 'select', options: ['Yes', 'No'] };
    case 'SELECT_APPROVE_DECLINE_FIELD':
      return { fieldType: 'select', options: ['Approve', 'Decline'] };
    default:
      return { fieldType: 'text' };
  }
}

function taskFormKey(typeId: string, stepId: string, taskId: string): string {
  return `${typeId}_${slug(stepId)}_${slug(taskId)}`.toUpperCase();
}

function extractForms(typeId: string, raw: StageTemplate): GeneratedFormSeed[] {
  const forms: GeneratedFormSeed[] = [];

  if (raw.fields?.length) {
    forms.push({
      key: `${typeId}:request`,
      label: `${raw.name} — Initial Data`,
      fields: raw.fields.map((f, i) => {
        const mapped = mapFieldType(f.defKey);
        return {
          key: f.key,
          label: f.label ?? f.key,
          fieldType: mapped.fieldType,
          mandatory: f.mandatory,
          options: mapped.options,
          sortOrder: i,
        };
      }),
    });
  }

  for (const step of raw.steps ?? []) {
    for (const task of step.tasks ?? []) {
      if (task.type !== 'MANUAL' || !task.taskDetail?.fields?.length) continue;
      forms.push({
        key: taskFormKey(typeId, step.stepId, task.taskId),
        label: task.name ?? task.taskId,
        fields: task.taskDetail.fields.map((f, i) => {
          const mapped = mapFieldType(f.defKey);
          return {
            key: f.key,
            label: f.label ?? f.key,
            fieldType: mapped.fieldType,
            mandatory: f.mandatory,
            options: mapped.options,
            sortOrder: i,
          };
        }),
      });
    }
  }

  return forms;
}

interface StepWire {
  stepId: string;
  entryId: string;
  beforeGatewayId: string;
  gatewayId: string;
}

function convertTemplate(typeId: string, raw: StageTemplate): WorkflowDefinition {
  const elements: WorkflowDefinition['elements'] = [
    { id: 'start', type: 'startEvent', name: 'Start' },
  ];
  const flows: WorkflowDefinition['flows'] = [];
  const stepWires: StepWire[] = [];

  let preCreationTail = 'start';

  for (const pre of raw.preCreationTasks ?? []) {
    const id = `svc_${slug(pre.taskId)}`;
    elements.push({
      id,
      type: 'serviceTask',
      name: pre.name || pre.handler,
      handler: pre.handler,
    });
    flows.push({ id: `f_${preCreationTail}_${id}`, sourceRef: preCreationTail, targetRef: id });
    preCreationTail = id;
  }

  for (let stepIndex = 0; stepIndex < (raw.steps ?? []).length; stepIndex++) {
    const step = raw.steps![stepIndex];
    const stepTasks = step.tasks ?? [];
    const autoTasks = stepTasks.filter((t) => t.type === 'AUTOMATIC');
    const manualTasks = stepTasks.filter((t) => t.type === 'MANUAL');

    let stepEntryId: string | null = null;
    let beforeGatewayId: string | null = null;
    const connectFrom = stepIndex === 0 ? preCreationTail : null;

    for (const auto of autoTasks) {
      const id = `svc_${slug(step.stepId)}_${slug(auto.taskId)}`;
      elements.push({
        id,
        type: 'serviceTask',
        name: auto.name ?? auto.handler ?? auto.taskId,
        handler: auto.handler ?? 'UnknownHandler',
      });

      const source = beforeGatewayId ?? connectFrom;
      if (source) {
        flows.push({ id: `f_${source}_${id}`, sourceRef: source, targetRef: id });
      }

      if (!stepEntryId) stepEntryId = id;
      beforeGatewayId = id;
    }

    if (manualTasks.length > 1) {
      const forkId = `pg_fork_${slug(step.stepId)}`;
      const joinId = `pg_join_${slug(step.stepId)}`;
      elements.push(
        {
          id: forkId,
          type: 'parallelGateway',
          name: `${step.name ?? step.stepId} Fork`,
          gatewayDirection: 'fork',
        },
        {
          id: joinId,
          type: 'parallelGateway',
          name: `${step.name ?? step.stepId} Join`,
          gatewayDirection: 'join',
        },
      );

      const forkSource = beforeGatewayId ?? connectFrom;
      if (forkSource) {
        flows.push({ id: `f_${forkSource}_${forkId}`, sourceRef: forkSource, targetRef: forkId });
      }
      if (!stepEntryId) stepEntryId = forkId;

      for (const task of manualTasks) {
        const utId = `ut_${slug(step.stepId)}_${slug(task.taskId)}`;
        elements.push({
          id: utId,
          type: 'userTask',
          name: task.name ?? task.taskId,
          formKey: taskFormKey(typeId, step.stepId, task.taskId),
          candidateRoles: normalizeRoles(task.taskDetail?.assignedTo?.roleNames),
          slaHours: task.etaHours,
        });
        flows.push(
          { id: `f_${forkId}_${utId}`, sourceRef: forkId, targetRef: utId },
          { id: `f_${utId}_${joinId}`, sourceRef: utId, targetRef: joinId },
        );
      }
      beforeGatewayId = joinId;
    } else if (manualTasks.length === 1) {
      const task = manualTasks[0];
      const utId = `ut_${slug(step.stepId)}_${slug(task.taskId)}`;
      elements.push({
        id: utId,
        type: 'userTask',
        name: task.name ?? task.taskId,
        formKey: taskFormKey(typeId, step.stepId, task.taskId),
        candidateRoles: normalizeRoles(task.taskDetail?.assignedTo?.roleNames),
        slaHours: task.etaHours,
      });

      const utSource = beforeGatewayId ?? connectFrom;
      if (utSource) {
        flows.push({ id: `f_${utSource}_${utId}`, sourceRef: utSource, targetRef: utId });
      }
      if (!stepEntryId) stepEntryId = utId;
      beforeGatewayId = utId;
    }

    if (!stepEntryId || !beforeGatewayId) {
      throw new Error(`${typeId}: step "${step.stepId}" produced no executable elements`);
    }

    const gatewayId = `xg_${slug(step.stepId)}`;
    elements.push({
      id: gatewayId,
      type: 'exclusiveGateway',
      name: `${step.name ?? step.stepId} Routing`,
    });
    flows.push({
      id: `f_${beforeGatewayId}_${gatewayId}`,
      sourceRef: beforeGatewayId,
      targetRef: gatewayId,
    });

    stepWires.push({
      stepId: step.stepId,
      entryId: stepEntryId,
      beforeGatewayId,
      gatewayId,
    });
  }

  const entryByStep = new Map(stepWires.map((w) => [w.stepId, w.entryId]));

  elements.push(
    { id: 'end_completed', type: 'endEvent', name: 'Completed', terminateAll: true },
    { id: 'end_rejected', type: 'endEvent', name: 'Rejected', terminateAll: true },
  );

  for (const step of raw.steps ?? []) {
    const wire = stepWires.find((w) => w.stepId === step.stepId);
    if (!wire) continue;

    for (const [idx, tr] of (step.transitions ?? []).entries()) {
      let targetRef = 'end_completed';
      if (tr.nextStepId != null) {
        const entry = entryByStep.get(tr.nextStepId);
        if (!entry) {
          throw new Error(
            `${typeId}: transition references unknown step "${tr.nextStepId}"`,
          );
        }
        targetRef = entry;
      } else if (
        tr.condition.includes('Decline') ||
        tr.condition.includes("'No'") ||
        tr.condition.includes('== \'No\'')
      ) {
        targetRef = 'end_rejected';
      }

      flows.push({
        id: `f_${wire.gatewayId}_${slug(tr.condition)}_${idx}`,
        sourceRef: wire.gatewayId,
        targetRef,
        condition: mapCondition(tr.condition),
        isDefault: tr.condition === 'default' ? true : undefined,
      });
    }
  }

  const definition: WorkflowDefinition = {
    id: typeId,
    version: 1,
    name: raw.name,
    description: raw.description,
    elements,
    flows,
  };

  return parseWorkflowDefinition(definition);
}

function parseArgs(argv: string[]): {
  input: string;
  output: string;
  formsOutput?: string;
  skip: Set<string>;
} {
  const inputIdx = argv.indexOf('--input');
  const outputIdx = argv.indexOf('--output');
  if (inputIdx < 0 || outputIdx < 0) {
    throw new Error(
      'Required flags: --input <templatesDir> --output <workflowSeedDir>',
    );
  }

  const formsIdx = argv.indexOf('--forms-output');
  const skipIdx = argv.indexOf('--skip');
  const skip = new Set<string>();
  if (skipIdx >= 0 && argv[skipIdx + 1]) {
    for (const item of argv[skipIdx + 1].split(',')) {
      const trimmed = item.trim();
      if (trimmed) skip.add(trimmed);
    }
  }

  return {
    input: argv[inputIdx + 1],
    output: argv[outputIdx + 1],
    formsOutput: formsIdx >= 0 ? argv[formsIdx + 1] : undefined,
    skip,
  };
}

function main(): void {
  const { input, output, formsOutput, skip } = parseArgs(process.argv.slice(2));
  mkdirSync(output, { recursive: true });

  const allForms: GeneratedFormSeed[] = [];
  const requiredFields: Record<string, string[]> = {};

  for (const file of readdirSync(input)) {
    if (!file.endsWith('.json') || SKIP_FILES.has(file)) continue;
    const typeId = basename(file, '.json');
    if (skip.has(typeId)) {
      console.log(`Skipped ${typeId}`);
      continue;
    }

    const raw = JSON.parse(readFileSync(join(input, file), 'utf8')) as StageTemplate;
    const dsl = convertTemplate(typeId, raw);
    const outPath = join(output, `${typeId}.json`);
    writeFileSync(outPath, JSON.stringify(dsl, null, 2));
    console.log(`Wrote ${outPath}`);

    allForms.push(...extractForms(typeId, raw));
    if (raw.fields?.length) {
      requiredFields[typeId] = raw.fields
        .filter((f) => f.mandatory)
        .map((f) => f.key);
    }
  }

  if (formsOutput) {
    mkdirSync(join(formsOutput, '..'), { recursive: true });
    writeFileSync(
      formsOutput,
      JSON.stringify({ forms: allForms, requiredFields }, null, 2),
    );
    console.log(`Wrote forms manifest ${formsOutput}`);
  }
}

main();
