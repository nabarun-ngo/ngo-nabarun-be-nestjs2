import { WorkflowModule } from "@nabarun-ngo/nestjs-shared-workflow";
import { WorkflowHostModule } from "../modules/workflow/workflow-host.module";
import { QUEUE_MODULE } from "./queue-module.config";

export const WORKFLOW_MODULE = WorkflowModule.forRoot(
    { defaultTimezone: 'Asia/Kolkata' },
    { queueModule: QUEUE_MODULE },
);

export const WORKFLOW_HOST_MODULE = WorkflowHostModule.forRoot({ imports: [WORKFLOW_MODULE] });