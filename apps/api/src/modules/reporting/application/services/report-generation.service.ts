import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { BusinessException } from '@nabarun-ngo/nestjs-shared-core';
import { WorkflowFacade } from '@nabarun-ngo/nestjs-shared-workflow';
import { Report } from '../../domain/aggregates/report/report.aggregate';
import { ReportStatus } from '../../domain/enums/report-status.enum';
import { IReportRepository } from '../../domain/repositories/report.repository';
import { IReportDefinitionsPort } from '../../domain/ports/report-definitions.port';
import { ReportRegistryService } from './report-registry.service';
import { ReportingDmsFacade } from '../../infrastructure/adapters/reporting-dms.facade';

@Injectable()
export class ReportGenerationService {
  constructor(
    private readonly registry: ReportRegistryService,
    @Inject(IReportRepository) private readonly reportRepository: IReportRepository,
    @Inject(IReportDefinitionsPort) private readonly definitionsPort: IReportDefinitionsPort,
    private readonly dmsFacade: ReportingDmsFacade,
    private readonly workflowFacade: WorkflowFacade,
  ) { }

  async startReportWorkflow(params: {
    reportCode: string;
    parameters: Record<string, unknown>;
    requestedById: string;
    userPermissions: string[];
    userRoles: string[];
  }): Promise<{ workflowId: string; reportId?: string }> {
    const definition = await this.definitionsPort.getDefinition(params.reportCode);
    if (!definition || !definition.isActive) {
      throw new NotFoundException(`Report definition for ${params.reportCode} not found`);
    }
    if (definition.approverRoles?.length) {
      const allowed = params.userRoles.some((role) => definition.approverRoles?.includes(role));
      if (!allowed) {
        throw new BusinessException(
          `You do not have the required role to generate this report. Required: ${definition.approverRoles.join(', ')}`,
        );
      }
    }

    const instance = await this.workflowFacade.startWorkflow({
      definitionId: 'REPORT_REVIEW',
      context: {
        reportCode: params.reportCode,
        reportName: definition.displayName,
        parameters: params.parameters,
        requestedById: params.requestedById,
        roleNames: definition.approverRoles?.join(',') ?? '',
        needApproval: definition.requiresApproval,
      },
      initiatedById: params.requestedById,
    });

    return { workflowId: instance.id };
  }

  async generateForReport(params: {
    reportId?: string;
    reportCode: string;
    parameters: Record<string, unknown>;
    requestedById: string;
    userPermissions: string[];
    needApproval: boolean;
    approverRoles: string[];
    viewerRoles: string[];
    reportName: string;
    workflowId?: string;
    regenerate?: boolean;
  }): Promise<Report> {
    const provider = this.registry.getProvider(params.reportCode);
    if (!provider) {
      throw new NotFoundException(`Report provider for ${params.reportCode} not found`);
    }

    let report: Report;
    if (params.regenerate && params.reportId) {
      report = (await this.reportRepository.findById(params.reportId))!;
      if (!report) throw new NotFoundException('Report not found');
      if (report.status === ReportStatus.APPROVED) {
        throw new BusinessException('Report is already approved');
      }
    } else if (params.reportId) {
      report = (await this.reportRepository.findById(params.reportId))!;
      if (!report) throw new NotFoundException('Report not found');
    } else {
      report = Report.create({
        reportCode: params.reportCode,
        reportName: params.reportName,
        requestedById: params.requestedById,
        parameters: params.parameters,
        needApproval: params.needApproval,
        approverRoles: params.approverRoles,
        viewerRoles: params.viewerRoles,
      });
      report = await this.reportRepository.create(report);
    }

    const generated = await provider.generate(params.parameters as never);
    report.incrementVersion();

    const docId = await this.dmsFacade.uploadReportDocument({
      buffer: generated.buffer,
      fileName: `${generated.fileName}-v${report.docVersion}.${generated.fileExtension}`,
      contentType: generated.contentType,
      reportId: report.id,
      userId: params.requestedById,
      userPermissions: params.userPermissions,
    });
    report.docId = docId;

    if (params.workflowId) {
      report.workflowId = params.workflowId;
    }

    if (!params.needApproval && !params.regenerate) {
      report.markApproved(params.requestedById);
    }

    const updated = await this.reportRepository.update(report.id, report);
    return updated;
  }

  async finalizeApproval(reportId: string, approvedById: string): Promise<Report> {
    const report = await this.reportRepository.findById(reportId);
    if (!report) throw new NotFoundException('Report not found');
    report.markApproved(approvedById);
    return this.reportRepository.update(report.id, report);
  }

  async deleteReport(reportId: string): Promise<void> {
    const report = await this.reportRepository.findById(reportId);
    if (!report) throw new NotFoundException('Report not found');
    const docs = await this.dmsFacade.getDocuments(reportId);
    if (docs.length) {
      await this.dmsFacade.deleteDocuments(docs.map((d) => d.id));
    }
    await this.reportRepository.delete(reportId);
  }
}
