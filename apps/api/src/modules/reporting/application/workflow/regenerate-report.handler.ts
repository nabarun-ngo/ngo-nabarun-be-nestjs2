import { Injectable } from '@nestjs/common';
import { WorkflowTaskHandler, WorkflowTaskHandlerContract } from '@ce/nestjs-shared-workflow';
import { ReportGenerationService } from '../services/report-generation.service';
import { IReportDefinitionsPort } from '../../domain/ports/report-definitions.port';
import { Inject } from '@nestjs/common';

@Injectable()
@WorkflowTaskHandler('RegenerateReportHandler')
export class RegenerateReportHandler implements WorkflowTaskHandlerContract {
  constructor(
    private readonly reportGenerationService: ReportGenerationService,
    @Inject(IReportDefinitionsPort) private readonly definitionsPort: IReportDefinitionsPort,
  ) {}

  async execute(params: {
    instanceId: string;
    elementId: string;
    input: Record<string, unknown>;
  }): Promise<Record<string, unknown>> {
    const reportId = String(params.input.reportId ?? '');
    const reportCode = String(params.input.reportCode ?? '');
    const definition = await this.definitionsPort.getDefinition(reportCode);
    const requestedById = String(params.input.requestedById ?? params.input.initiatedById ?? '');

    const report = await this.reportGenerationService.generateForReport({
      reportId,
      reportCode,
      parameters: (params.input.parameters as Record<string, unknown>) ?? {},
      requestedById,
      userPermissions: ['create:reports', 'read:reports'],
      needApproval: Boolean(params.input.needApproval ?? definition?.requiresApproval),
      approverRoles: definition?.approverRoles ?? [],
      viewerRoles: definition?.visibleToRoles ?? [],
      reportName: String(params.input.reportName ?? definition?.displayName ?? reportCode),
      workflowId: params.instanceId,
      regenerate: true,
    });

    return { reportId: report.id, reportName: report.reportName };
  }
}
