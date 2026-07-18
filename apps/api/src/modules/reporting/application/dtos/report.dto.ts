import { Report } from '../../domain/aggregates/report/report.aggregate';
import { ReportStatus } from '../../domain/enums/report-status.enum';
import { ReportDefinition } from '../../domain/reporting.interface';

export class ReportDetailDto {
  id: string;
  reportCode: string;
  reportName: string;
  requestedById?: string;
  requestedByName?: string;
  status: ReportStatus;
  parameters?: Record<string, unknown>;
  needApproval: boolean;
  approvedById?: string;
  approvedByName?: string;
  approvedAt?: Date;
  approvers: string[];
  viewers: string[];
  dmsDocumentId?: string;
  version: number;
  workflowId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class ReportCategoryDto {
  reportCode: string;
  reportName: string;
  description?: string;
  viewerRoles: string[];
  manageRoles?: string[];
  isActive?: boolean;
}

export class ReportFilterDto {
  status?: ReportStatus;
  requestedById?: string;
}

export class ReportInputFieldDto {
  key: string;
  label: string;
  fieldType: string;
  mandatory?: boolean;
}

export class ReportMapper {
  static toDetailDto(report: Report): ReportDetailDto {
    const requestedByName = report.requestedBy
      ? [report.requestedBy.firstName, report.requestedBy.lastName].filter(Boolean).join(' ')
      : undefined;
    const approvedByName = report.approvedBy
      ? [report.approvedBy.firstName, report.approvedBy.lastName].filter(Boolean).join(' ')
      : undefined;
    return {
      id: report.id,
      reportCode: report.reportCode,
      reportName: report.reportName,
      requestedById: report.requestedBy?.id,
      requestedByName,
      status: report.status,
      parameters: report.parameters,
      needApproval: report.needApproval,
      approvedById: report.approvedBy?.id,
      approvedByName,
      approvedAt: report.approvedAt,
      approvers: report.approverRoles,
      viewers: report.viewerRoles,
      dmsDocumentId: report.docId,
      version: report.docVersion,
      workflowId: report.workflowId,
      createdAt: report.createdAt!,
      updatedAt: report.updatedAt!,
    };
  }

  static toCategoryDto(definition: ReportDefinition): ReportCategoryDto {
    return {
      reportCode: definition.reportCode,
      reportName: definition.displayName,
      description: definition.description,
      viewerRoles: definition.visibleToRoles,
      manageRoles: definition.approverRoles,
      isActive: definition.isActive,
    };
  }
}
