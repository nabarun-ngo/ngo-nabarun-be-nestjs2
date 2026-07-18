import { Injectable } from '@nestjs/common';
import { WorkflowTaskHandler, WorkflowTaskHandlerContract } from '@nabarun-ngo/nestjs-shared-workflow';
import { ReportGenerationService } from '../services/report-generation.service';

@Injectable()
@WorkflowTaskHandler('FinalizeReportApprovalHandler')
export class FinalizeReportApprovalHandler implements WorkflowTaskHandlerContract {
  constructor(private readonly reportGenerationService: ReportGenerationService) { }

  async execute(params: {
    instanceId: string;
    elementId: string;
    input: Record<string, unknown>;
  }): Promise<Record<string, unknown>> {
    const reportId = String(params.input.reportId ?? '');
    const approvedById = String(
      params.input.approvedById ?? params.input.requestedById ?? params.input.initiatedById ?? '',
    );
    const report = await this.reportGenerationService.finalizeApproval(reportId, approvedById);
    return { reportId: report.id, status: report.status };
  }
}
