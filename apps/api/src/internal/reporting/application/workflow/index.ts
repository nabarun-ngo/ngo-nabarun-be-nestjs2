import { GenerateReportHandler } from './generate-report.handler';
import { RegenerateReportHandler } from './regenerate-report.handler';
import { FinalizeReportApprovalHandler } from './finalize-report-approval.handler';

export { GenerateReportHandler, RegenerateReportHandler, FinalizeReportApprovalHandler };

export const ReportingWorkflowHandlers = [
  GenerateReportHandler,
  RegenerateReportHandler,
  FinalizeReportApprovalHandler,
];
