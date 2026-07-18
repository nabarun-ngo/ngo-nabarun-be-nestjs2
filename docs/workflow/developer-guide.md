# Workflow Engine 2.0 — Developer Guide

This guide explains how to develop against the BPMN-lite workflow engine in this monorepo: architecture, definitions, forms, service handlers, APIs, and local workflows.

For production incident response, see [runbooks.md](./runbooks.md).

---

## Architecture at a glance

```
JsonStore (workflow definitions)     Custom Forms (entityType: workflow)
              │                                    │
              └──────────┬─────────────────────────┘
                         ▼
              @nabarun-ngo/nestjs-shared-workflow
              WorkflowFacade / StateMachineRunner
                         │
         ┌───────────────┼───────────────┐
         ▼               ▼               ▼
   PostgreSQL        BullMQ queue     Correspondence (outbox)
   instances         service tasks    notifications
   event log         timers/SLA
   inbox/tokens
```

| Layer | Package / path | Responsibility |
|-------|----------------|----------------|
| Engine | `packages/nestjs-shared-workflow` | DSL, state machine, CQRS, HTTP controllers |
| Persistence | `apps/api/src/persistence/workflow/` | Prisma repositories |
| Integrations | `apps/api/src/integrations/workflow/` | JsonStore, forms, queue, user resolution |
| Host handlers | `apps/api/src/modules/workflow/` | `@WorkflowTaskHandler`, cron starts |
| Definitions | `apps/api/prisma/seeds/json-store/workflow/` | Published BPMN-lite JSON |
| Forms | `apps/api/prisma/seeds/workflow-forms.*` | Custom form definitions per `formKey` |

The engine is **element-based** (not step/task tables). Runtime state lives in:

- `workflow_instances.currentElementId` + `context`
- `workflow_tokens` (parallel branches)
- `workflow_task_inbox` (human tasks)
- `workflow_event_log` (append-only audit)
- `workflow_outbox` (reliable side effects)

---

## Quick start (local)

### Prerequisites

- PostgreSQL and Redis running
- Migrations and seeds applied

```bash
# From repo root
npm run build
cd apps/api
npm run migrate:dev
npx prisma db seed
npm run start
```

### Start a workflow via HTTP

```http
POST /workflows
Authorization: Bearer <jwt>
Content-Type: application/json

{
  "definitionId": "CONTACT_REQUEST",
  "name": "Support from Jane Doe",
  "context": {
    "fullName": "Jane Doe",
    "email": "jane@example.com",
    "contactNumber": "+911234567890",
    "subject": "Membership query",
    "message": "I need help with my application."
  }
}
```

Requires permission `create:workflow`. The instance id format is `NW` + 10 digits (e.g. `NW0000000042`).

### Complete a task

1. `GET /workflows/inbox/me` — find open tasks (`read:task`)
2. `POST /workflows/tasks/:taskId/claim` — optional (`update:task`)
3. `POST /workflows/tasks/:taskId/complete` with `formValues` (`update:task`)

```json
{
  "formValues": {
    "isResolved": "Yes",
    "resolutionRemarks": "Called member and closed the ticket."
  }
}
```

---

## Module wiring (host app)

`apps/api/src/app.module.ts` registers:

```typescript
const workflowModule = WorkflowModule.forRoot(
  { defaultTimezone: 'Asia/Kolkata' },
  { queueModule },
);

// imports:
workflowModule,
WorkflowHostModule.forRoot({ imports: [workflowModule] }),
CustomFormsModule.forRootAsync({
  // ...
  entityTypes: [
    { entityType: 'donation' },
    { entityType: 'workflow', displayName: 'Workflow' },
  ],
}),
```

`WorkflowModule` is **not global**. Import it where you need `WorkflowFacade` (e.g. `WorkflowHostModule`).

Required port adapters are registered in `IntegrationsModule` and `PersistenceModule`. Boot fails fast via `RequiredPortsGuard` if any are missing.

---

## WorkflowFacade (internal API)

Prefer `WorkflowFacade` for in-process starts (cron jobs, domain events, other modules). Do **not** dispatch a “start workflow” queue job.

```typescript
import { WorkflowFacade, WorkflowRequesterType } from '@nabarun-ngo/nestjs-shared-workflow';

@Injectable()
export class MyService {
  constructor(private readonly workflow: WorkflowFacade) {}

  async onSomethingHappened() {
    await this.workflow.startWorkflow({
      definitionId: 'DONATION_PAUSE_REQUEST',
      name: 'Pause request',
      context: { startDate: '2026-08-01', endDate: '2026-09-01', reason: 'Travel' },
      requester: { type: WorkflowRequesterType.Internal, id: userId },
      idempotencyKey: `pause:${userId}:2026-08-01`,
    });
  }
}
```

### Requester model

| `requester.type` | `initiatedById` | `isExtUser` | Use case |
|------------------|-----------------|-------------|----------|
| `internal` | User profile id | `false` | Logged-in member/staff |
| `external` | `null` | `true` | Public form submission; set `contactRef` for email |

If `requester` is omitted and `initiatedById` is set, the engine treats the caller as internal.

### Facade methods

| Method | Purpose |
|--------|---------|
| `startWorkflow` | Create instance, run to first halt |
| `completeUserTask` | Submit task form, advance engine |
| `claimTask` / `delegateTask` | Inbox management |
| `cancelWorkflow` | Terminal cancel + event log |
| `getInstance` | Read instance row |
| `getMyInbox` | Open tasks for user |
| `getTimeline` | Event log entries |

---

## BPMN-lite definition DSL

Definitions are stored in JsonStore namespace `workflow`, validated by `WorkflowDefinitionSchema` (Zod).

### JsonStore keys

| Key | Purpose |
|-----|---------|
| `workflow/{TYPE}` | Latest published definition (seed files use this) |
| `workflow/{TYPE}@v{N}` | Immutable version (optional) |
| `workflow/{TYPE}@draft` | Draft under edit (cannot start instances) |

### Element types

| `type` | Runtime behaviour |
|--------|-------------------|
| `startEvent` | Entry (exactly one per definition) |
| `endEvent` | Terminal; `terminateAll: true` ends all tokens |
| `userTask` | Creates inbox item; optional `formKey`, `candidateRoles`, `slaHours` |
| `serviceTask` | Runs `@WorkflowTaskHandler` via BullMQ (`ProcessServiceTaskJob`) |
| `exclusiveGateway` | XOR routing via `condition` expressions |
| `parallelGateway` | `gatewayDirection: 'fork' \| 'join'` |
| `inclusiveGateway` | N-of-M join (fork/join) |
| `subProcess` | Child workflow via `definitionId` |

### Sequence flows

```json
{
  "id": "f_approval_approved",
  "sourceRef": "xg_approval",
  "targetRef": "svc_create_account",
  "condition": "decision == 'Approve'"
}
```

- Conditions use [expr-eval](https://www.npmjs.com/package/expr-eval) against the **flat instance context**.
- Form values merged on task completion appear at top level (e.g. `correctionNeeded`, `decision`).
- Use `isDefault: true` for fallback branches on exclusive gateways.

### Minimal example

```json
{
  "id": "MY_WORKFLOW",
  "version": 1,
  "name": "My Workflow",
  "elements": [
    { "id": "start", "type": "startEvent" },
    { "id": "svc_validate", "type": "serviceTask", "handler": "ValidateInputs" },
    { "id": "ut_review", "type": "userTask", "formKey": "MY_WORKFLOW_REVIEW", "candidateRoles": ["SECRETARY"], "slaHours": 24 },
    { "id": "xg_route", "type": "exclusiveGateway" },
    { "id": "end_done", "type": "endEvent", "terminateAll": true }
  ],
  "flows": [
    { "id": "f1", "sourceRef": "start", "targetRef": "svc_validate" },
    { "id": "f2", "sourceRef": "svc_validate", "targetRef": "ut_review" },
    { "id": "f3", "sourceRef": "ut_review", "targetRef": "xg_route" },
    { "id": "f4", "sourceRef": "xg_route", "targetRef": "end_done", "condition": "approved == 'Yes'" },
    { "id": "f5", "sourceRef": "xg_route", "targetRef": "ut_review", "isDefault": true }
  ]
}
```

Validate locally:

```typescript
import { parseWorkflowDefinition } from '@nabarun-ngo/nestjs-shared-workflow';
parseWorkflowDefinition(json); // throws on invalid graph
```

---

## Custom Forms integration

Dynamic workflow data uses Custom Forms with `entityType: 'workflow'`.

### Form key conventions

| Pattern | `entityId` scope | Example |
|---------|------------------|---------|
| `{TYPE}:request` | `instanceId` | Initial submission fields at start |
| `{TYPE}_{STEP}_{TASK}` | `{instanceId}:{elementId}` | Per-task form on completion |

The adapter lives in `workflow-form-data.adapter.ts` (`WORKFLOW_FORM_DATA_PORT`).

### Adding forms for a new workflow

1. Add form rows to `apps/api/prisma/seeds/workflow-forms.seed.ts` (hand-crafted) or regenerate via migrator manifest.
2. Ensure each `userTask.formKey` in the DSL has a matching published form.
3. Re-run `npx prisma db seed`.

Field types: `text`, `number`, `date`, `select` (with `Yes`/`No` or `Approve`/`Decline` options).

---

## Service task handlers (host)

Register handlers in `apps/api/src/modules/workflow/` using `@WorkflowTaskHandler`:

```typescript
import { Injectable } from '@nestjs/common';
import {
  WorkflowTaskHandler,
  WorkflowTaskHandlerContract,
} from '@nabarun-ngo/nestjs-shared-workflow';

@Injectable()
@WorkflowTaskHandler('MyHandler')
export class MyHandler implements WorkflowTaskHandlerContract {
  async execute(params: {
    instanceId: string;
    elementId: string;
    input: Record<string, unknown>;
    correlationId?: string;
  }): Promise<Record<string, unknown> | void> {
    // input is projected from instance.context
    // return value is merged into context
  }
}
```

Add the class to `WorkflowHostModule` providers. `TaskHandlerRegistryService` discovers handlers at boot.

### Built-in / stub handlers

| Handler | Status |
|---------|--------|
| `ValidateInputs` | Production — checks mandatory fields per workflow type |
| `UserNotRegisteredTaskHandler` | Production — duplicate email check |
| `Auth0UserCreationHandler` | Stub |
| `GuestDonationCreationHandler` | Stub |
| `DonationPauseUpdateHandler` | Stub |
| `DonationAmountUpdateHandler` | Stub |
| `UserDeleteAndDataCleanupHandler` | Stub |

Service tasks always enqueue asynchronously (`ProcessServiceTaskJob`). Idempotency key: `service-task:{instanceId}:{elementId}`.

---

## Cron-triggered workflows

Cron jobs enqueue `StartWorkflowCronJob` (class name = BullMQ job name). The host handler calls `WorkflowFacade` directly:

```typescript
// apps/api/src/modules/workflow/handlers/start-workflow-cron.handler.ts
@QueueHandler(StartWorkflowCronJob)
export class StartWorkflowCronHandler { /* ... */ }
```

Register a cron definition in JsonStore namespace `cron`:

```json
{
  "name": "annual-campaign-reminder",
  "expression": "0 0 1 1 *",
  "description": "Start SOCIAL_MEDIA_CAMPAIGN_CRON_UPDATE yearly",
  "handler": "StartWorkflowCronJob",
  "enabled": true,
  "inputData": {
    "definitionId": "SOCIAL_MEDIA_CAMPAIGN_CRON_UPDATE",
    "name": "Update year-specific campaign crons",
    "context": {}
  }
}
```

---

## HTTP API reference

### User endpoints (`/workflows`)

| Method | Path | Permission |
|--------|------|------------|
| `POST` | `/workflows` | `create:workflow` |
| `GET` | `/workflows/inbox/me` | `read:task` |
| `GET` | `/workflows/:instanceId` | `read:workflow` |
| `GET` | `/workflows/:instanceId/timeline` | `read:workflow` |
| `POST` | `/workflows/:instanceId/cancel` | `update:workflow` |
| `POST` | `/workflows/tasks/:taskId/claim` | `update:task` |
| `POST` | `/workflows/tasks/:taskId/complete` | `update:task` |
| `POST` | `/workflows/tasks/:taskId/delegate` | `update:task` |

### Admin endpoints (`/workflows/admin`)

| Method | Path | Permission |
|--------|------|------------|
| `GET` | `/workflows/admin/stuck?olderThanMinutes=60` | `admin:workflows` |
| `POST` | `/workflows/admin/:instanceId/force-skip` | `admin:workflows` |
| `POST` | `/workflows/admin/definitions/publish` | `manage:workflow-definitions` |

Pass `idempotencyKey` on start/complete for safe retries (24h TTL by default).

---

## Published workflow types

| `definitionId` | Description |
|----------------|-------------|
| `JOIN_REQUEST` | Member onboarding (parallel verification, approval loop) |
| `CONTACT_REQUEST` | Support / contact form |
| `DONATION_REQUEST` | Guest donation collection |
| `DONATION_PAUSE_REQUEST` | Treasurer-approved pause |
| `DONATION_AMT_CHANGE_REQUEST` | Treasurer-approved amount change |
| `TERMINATION_REQUEST` | Member exit / offboarding |
| `ACCOUNT_ADJUSTMENT` | Treasurer account create/close on role change |
| `SOCIAL_MEDIA_CAMPAIGN` | Poster → publish → email campaign |
| `SOCIAL_MEDIA_CAMPAIGN_CRON_UPDATE` | Annual cron date maintenance |
| `REPORT_REVIEW` | Report approval |

---

## Adding a new workflow (checklist)

### 1. Author the DSL

- Add `apps/api/prisma/seeds/json-store/workflow/MY_TYPE.json`
- Or migrate from stage: see [Migrating from stage templates](#migrating-from-stage-templates)
- Validate: `npm test -- --testPathPattern=workflow-seed`

### 2. Add Custom Forms

- Request form: `MY_TYPE:request`
- Task forms: one per `userTask.formKey`
- Update `workflow-forms.seed.ts` or regenerate manifest

### 3. Add validation rules

In `validate-inputs.handler.ts`, add mandatory fields for `MY_TYPE` (or extend `workflow-forms.generated.json` via migrator).

### 4. Implement service handlers

Create `@WorkflowTaskHandler` classes for each `serviceTask.handler` value and register in `WorkflowHostModule`.

### 5. Seed and test

```bash
npx prisma db seed
# Start instance, complete tasks, inspect timeline
GET /workflows/:id/timeline
```

### 6. Assign permissions

Add workflow permissions to relevant roles in `apps/api/prisma/seeds/auth.seed.ts`:

- `create:workflow`, `read:workflow`, `update:workflow`
- `read:task`, `update:task`
- `admin:workflows`, `manage:workflow-definitions` (admins only)

---

## Migrating from stage templates

One-time conversion from `be-nestjs-stage` step/task JSON to BPMN-lite:

```bash
npx ts-node apps/api/scripts/workflow/migrate-stage-templates.ts \
  --input C:/path/to/be-nestjs-stage/src/modules/workflow/infrastructure/templates \
  --output apps/api/prisma/seeds/json-store/workflow \
  --forms-output apps/api/prisma/seeds/workflow-forms.generated.json \
  --skip JOIN_REQUEST,CONTACT_REQUEST
```

The script:

- Maps stage steps → elements + exclusive/parallel gateways
- Normalizes role names to monorepo RBAC keys (`GROUP_COORDINATOR` → `SECRETARY`, etc.)
- Strips `step_*_task_*.` prefixes from condition expressions
- Emits a forms manifest consumed by `workflow-forms.seed.ts`

**Review migrated output** before committing — complex loops and auto-close tasks may need hand-tuning.

---

## Context and routing

On start, `definitionId` is injected into context. Task form values merge into context on complete:

```json
{
  "definitionId": "JOIN_REQUEST",
  "firstName": "Ada",
  "correctionNeeded": "No",
  "rulesAccepted": "Yes",
  "form": { "correctionNeeded": "No", "rulesAccepted": "Yes" }
}
```

Gateway conditions reference top-level keys: `correctionNeeded == 'Yes' and rulesAccepted == 'Yes'`.

---

## Background jobs

| BullMQ job class | Purpose |
|------------------|---------|
| `ProcessServiceTaskJob` | Run service task handlers |
| `WorkflowTimerJob` | SLA deadline reached |
| `EscalationJob` | SLA escalation → outbox event |
| `OutboxDispatchJob` | Dispatch pending outbox rows |
| `DetectStuckWorkflowsJob` | Flag stale instances |
| `StartWorkflowCronJob` | Cron-initiated starts (host) |

Cron seeds for workflow maintenance:

- `cron/workflow-outbox-dispatch.json` — every minute
- `cron/workflow-detect-stuck.json` — every 6 hours

---

## Testing

| Test file | Covers |
|-----------|--------|
| `packages/nestjs-shared-workflow/src/dsl/workflow-seed-definitions.spec.ts` | All seed JSON parses |
| `packages/nestjs-shared-workflow/src/dsl/join-request-routing.spec.ts` | Gateway routing fixtures |

Run:

```bash
npm test -- --testPathPattern=workflow
```

Add routing contract tests when introducing branching logic for a new workflow.

---

## Enterprise behaviour (summary)

| Concern | Mechanism |
|---------|-----------|
| Durability | Transactional outbox + BullMQ |
| Idempotency | `workflow_idempotency_keys` on start, service tasks, complete |
| Concurrency | Optimistic lock on `workflow_instances.version` |
| Audit | Append-only `workflow_event_log` with actor on every transition |
| SLA | `slaHours` on userTask → timer → escalation outbox event |

---

## Troubleshooting

| Symptom | What to check |
|---------|---------------|
| Module won't boot | `RequiredPortsGuard` log — missing port adapter |
| Handler not found | Handler class in `WorkflowHostModule` providers? |
| Task not in inbox | `candidateRoles` vs user's roles; user resolution adapter |
| Wrong branch taken | Instance `context` vs gateway `condition` |
| Form save fails | Form published? `formKey` matches? `entityType: workflow` registered? |
| Service task stuck | Redis worker running? `ProcessServiceTaskJob` registered? |

See [runbooks.md](./runbooks.md) for operational playbooks.

---

## Key files index

```
packages/nestjs-shared-workflow/
  src/dsl/workflow-definition.schema.ts    # Zod DSL
  src/engine/state-machine.runner.ts       # Core execution
  src/application/services/workflow.facade.ts
  src/workflow.module.ts

apps/api/
  src/integrations/workflow/               # Port adapters
  src/persistence/workflow/              # Repositories
  src/modules/workflow/                   # Host handlers
  prisma/seeds/json-store/workflow/        # Definition seeds
  prisma/seeds/workflow-forms.seed.ts      # Form seeds
  scripts/workflow/migrate-stage-templates.ts

docs/workflow/
  developer-guide.md                       # This file
  runbooks.md                              # Operations
```
