# Workflow Engine 2.0 — Operational Runbooks

## Outbox lag

**Symptoms:** Side effects (emails, queue jobs) delayed; `workflow_outbox` rows stay `PENDING`.

**Checks:**
1. Confirm cron job `workflow-outbox-dispatch` is enabled in JsonStore `cron` namespace.
2. Verify `OutboxDispatchJob` handler is registered (workflow module boot logs).
3. Inspect `workflow_outbox` for `lastError` on failed rows.

**Actions:**
- Manually trigger cron: `POST /cron/workflow-outbox-dispatch/run` (requires `update:cron`).
- Replay failed rows after fixing root cause; delete poison messages if unrecoverable.
- Scale worker concurrency if Redis/BullMQ worker is saturated.

## Stuck workflow instances

**Symptoms:** Instance `updatedAt` unchanged; admin `/admin/workflows/stuck` reports entries.

**Checks:**
1. Cron `workflow-detect-stuck` enabled.
2. Open inbox items for the instance (`workflow_task_inbox`).
3. Review `workflow_event_log` timeline for last `element.entered` / `element.completed`.

**Actions:**
- Assign or complete blocking user tasks.
- Admin `POST /admin/workflows/:id/force-skip` to skip a blocked element (audit logged).
- Cancel instance if business-invalid: `POST /workflows/:id/cancel`.

## Wrong routing (exclusive gateway)

**Symptoms:** Workflow advanced to unexpected step; guards evaluated incorrectly.

**Checks:**
1. Compare instance `context` JSON with gateway `condition` expressions in published definition.
2. Confirm form submissions merged into context (`form` + top-level keys).
3. Validate definition in CI: `WorkflowDefinitionSchema` + contract tests.

**Actions:**
- Publish corrected definition version (does not affect in-flight instances).
- Admin force-skip to a known-good element if instance must be recovered.

## Orphaned child subprocess instances

**Symptoms:** Parent `WAITING_CHILD`; child `FAILED` or missing.

**Checks:**
1. Parent `parentInstanceId` linkage on child row.
2. Child event log for `workflow.subprocess.started` / completion events.

**Actions:**
- Complete or cancel child explicitly.
- Update parent status via admin tooling after child resolution.

## SLA false positives

**Symptoms:** Escalation fired while task still actionable; duplicate reminders.

**Checks:**
1. `workflow_task_inbox.slaDeadlineAt` vs server timezone (`WorkflowModule` `defaultTimezone`).
2. Idempotency keys `sla:{instanceId}:{elementId}` and `escalation:{instanceId}:{elementId}`.

**Actions:**
- Complete or release task to clear timers.
- Tune `slaHours` on userTask elements in definition DSL.

## Idempotency conflicts

**Symptoms:** HTTP 409 or `WorkflowIdempotencyConflictError` on retries.

**Actions:**
- Reuse same `X-Idempotency-Key` for safe retries of `POST /workflows`.
- Wait for TTL expiry (default 24h) before reusing keys with different payloads.

## Definition publish failures

**Symptoms:** `POST /admin/workflows/definitions/:type/publish` rejects payload.

**Checks:**
1. Zod validation errors from `WorkflowDefinitionSchema`.
2. Graph integrity: single `startEvent`, reachable `endEvent`, valid `sourceRef`/`targetRef`.

**Actions:**
- Fix DSL in draft JsonStore key `workflow/{TYPE}@draft`.
- Run `migrate-stage-templates.ts` for bulk conversion from stage JSON (seed-only).
