import { Injectable } from '@nestjs/common';
import { WorkflowTaskHandler, WorkflowTaskHandlerContract } from '@nabarun-ngo/nestjs-shared-workflow';
import { ReportGenerationService } from '../services/report-generation.service';
import { IReportDefinitionsPort } from '../../domain/ports/report-definitions.port';
import { Inject } from '@nestjs/common';

@Injectable()
@WorkflowTaskHandler('GenerateReportHandler')
export class GenerateReportHandler implements WorkflowTaskHandlerContract {
  constructor(
    private readonly reportGenerationService: ReportGenerationService,
    @Inject(IReportDefinitionsPort) private readonly definitionsPort: IReportDefinitionsPort,
  ) { }

  async execute(params: {
    instanceId: string;
    elementId: string;
    input: Record<string, unknown>;
  }): Promise<Record<string, unknown>> {
    const reportCode = String(params.input.reportCode ?? '');
    const definition = await this.definitionsPort.getDefinition(reportCode);
    const requestedById = String(params.input.requestedById ?? params.input.initiatedById ?? '');
    const parameters = (params.input.parameters as Record<string, unknown>) ?? {};

    const report = await this.reportGenerationService.generateForReport({
      reportCode,
      parameters,
      requestedById,
      userPermissions: ['create:reports', 'read:reports'],
      needApproval: Boolean(params.input.needApproval ?? definition?.requiresApproval),
      approverRoles: definition?.approverRoles ?? [],
      viewerRoles: definition?.visibleToRoles ?? [],
      reportName: String(params.input.reportName ?? definition?.displayName ?? reportCode),
      workflowId: params.instanceId,
    });

    return {
      reportId: report.id,
      reportName: report.reportName,
      reportCode: report.reportCode,
    };
  }
}
