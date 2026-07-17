import { z } from 'zod';

export const WorkflowElementTypeSchema = z.enum([
  'startEvent',
  'endEvent',
  'userTask',
  'serviceTask',
  'exclusiveGateway',
  'parallelGateway',
  'inclusiveGateway',
  'subProcess',
]);

export type WorkflowElementType = z.infer<typeof WorkflowElementTypeSchema>;

export const SequenceFlowSchema = z.object({
  id: z.string().min(1),
  sourceRef: z.string().min(1),
  targetRef: z.string().min(1),
  name: z.string().optional(),
  /** Expression evaluated against workflow context (expr-eval compatible). */
  condition: z.string().optional(),
  /** Default outgoing flow for exclusive gateways when no condition matches. */
  isDefault: z.boolean().optional(),
});

export type SequenceFlow = z.infer<typeof SequenceFlowSchema>;

const BaseElementSchema = z.object({
  id: z.string().min(1),
  name: z.string().optional(),
  documentation: z.string().optional(),
});

const StartEventElementSchema = BaseElementSchema.extend({
  type: z.literal('startEvent'),
});

const EndEventElementSchema = BaseElementSchema.extend({
  type: z.literal('endEvent'),
  /** When true, terminates all active tokens on the instance. */
  terminateAll: z.boolean().optional(),
});

const UserTaskElementSchema = BaseElementSchema.extend({
  type: z.literal('userTask'),
  formKey: z.string().optional(),
  candidateRoles: z.array(z.string()).optional(),
  assigneeExpression: z.string().optional(),
  slaHours: z.number().positive().optional(),
});

const ServiceTaskElementSchema = BaseElementSchema.extend({
  type: z.literal('serviceTask'),
  handler: z.string().min(1),
  inputMapping: z.record(z.string(), z.string()).optional(),
  compensationHandler: z.string().optional(),
});

const ExclusiveGatewayElementSchema = BaseElementSchema.extend({
  type: z.literal('exclusiveGateway'),
});

const ParallelGatewayElementSchema = BaseElementSchema.extend({
  type: z.literal('parallelGateway'),
  /** `fork` splits into parallel branches; `join` waits for all incoming tokens. */
  gatewayDirection: z.enum(['fork', 'join']).optional(),
});

const InclusiveGatewayElementSchema = BaseElementSchema.extend({
  type: z.literal('inclusiveGateway'),
  gatewayDirection: z.enum(['fork', 'join']).optional(),
});

export const WorkflowDefinitionSchema: z.ZodType<WorkflowDefinition> = z.lazy(() =>
  z
    .object({
      id: z.string().min(1),
      version: z.number().int().positive(),
      name: z.string().min(1),
      description: z.string().optional(),
      elements: z.array(WorkflowElementSchema).min(2),
      flows: z.array(SequenceFlowSchema).min(1),
    })
    .superRefine(validateWorkflowDefinitionGraph),
);

const SubProcessElementSchema = BaseElementSchema.extend({
  type: z.literal('subProcess'),
  definitionId: z.string().min(1),
  definitionVersion: z.number().int().positive().optional(),
  /** Inline sub-process when not resolved via WORKFLOW_DEFINITION_PORT. */
  embedded: WorkflowDefinitionSchema.optional(),
});

export const WorkflowElementSchema = z.discriminatedUnion('type', [
  StartEventElementSchema,
  EndEventElementSchema,
  UserTaskElementSchema,
  ServiceTaskElementSchema,
  ExclusiveGatewayElementSchema,
  ParallelGatewayElementSchema,
  InclusiveGatewayElementSchema,
  SubProcessElementSchema,
]);

export type WorkflowElement = z.infer<typeof WorkflowElementSchema>;

export type WorkflowDefinition = {
  id: string;
  version: number;
  name: string;
  description?: string;
  elements: WorkflowElement[];
  flows: SequenceFlow[];
};

function validateWorkflowDefinitionGraph(
  definition: WorkflowDefinition,
  ctx: z.RefinementCtx,
): void {
  const elementIds = new Set<string>();
  const flowIds = new Set<string>();

  for (const element of definition.elements) {
    if (elementIds.has(element.id)) {
      ctx.addIssue({
        code: 'custom',
        message: `Duplicate element id "${element.id}"`,
        path: ['elements'],
      });
      continue;
    }
    elementIds.add(element.id);
  }

  for (const flow of definition.flows) {
    if (flowIds.has(flow.id)) {
      ctx.addIssue({
        code: 'custom',
        message: `Duplicate flow id "${flow.id}"`,
        path: ['flows'],
      });
      continue;
    }
    flowIds.add(flow.id);

    if (!elementIds.has(flow.sourceRef)) {
      ctx.addIssue({
        code: 'custom',
        message: `Flow "${flow.id}" references unknown sourceRef "${flow.sourceRef}"`,
        path: ['flows'],
      });
    }

    if (!elementIds.has(flow.targetRef)) {
      ctx.addIssue({
        code: 'custom',
        message: `Flow "${flow.id}" references unknown targetRef "${flow.targetRef}"`,
        path: ['flows'],
      });
    }
  }

  const startEvents = definition.elements.filter((e) => e.type === 'startEvent');
  const endEvents = definition.elements.filter((e) => e.type === 'endEvent');

  if (startEvents.length !== 1) {
    ctx.addIssue({
      code: 'custom',
      message: `Workflow must contain exactly one startEvent (found ${startEvents.length})`,
      path: ['elements'],
    });
  }

  if (endEvents.length < 1) {
    ctx.addIssue({
      code: 'custom',
      message: 'Workflow must contain at least one endEvent',
      path: ['elements'],
    });
  }
}

export function parseWorkflowDefinition(input: unknown): WorkflowDefinition {
  return WorkflowDefinitionSchema.parse(input);
}

export function safeParseWorkflowDefinition(input: unknown) {
  return WorkflowDefinitionSchema.safeParse(input);
}
