import { Prisma } from '../prisma/client';
import { Report } from '../../../internal/reporting/domain/aggregates/report/report.aggregate';
import { ReportStatus } from '../../../internal/reporting/domain/enums/report-status.enum';

type ReportRow = Prisma.ReportGetPayload<{
  include: {
    requestedBy: { select: { id: true; firstName: true; lastName: true } };
    approvedBy: { select: { id: true; firstName: true; lastName: true } };
  };
}>;

export class ReportPrismaMapper {
  static toDomain(row: ReportRow | null): Report | null {
    if (!row) return null;
    return new Report(
      row.id,
      row.reportCode,
      row.reportName,
      row.requestedBy ?? (row.requestedById ? { id: row.requestedById } : undefined),
      row.status as ReportStatus,
      (row.parameters as Record<string, unknown> | null) ?? undefined,
      row.needApproval,
      row.approvedBy ?? (row.approvedById ? { id: row.approvedById } : undefined),
      row.approvedAt ?? undefined,
      row.approverRoles ?? [],
      row.viewerRoles ?? [],
      row.docId ?? undefined,
      row.workflowId ?? undefined,
      row.docVersion,
      row.createdAt,
      row.updatedAt,
    );
  }

  static toCreatePersistence(entity: Report): Prisma.ReportCreateInput {
    return {
      id: entity.id,
      reportCode: entity.reportCode,
      reportName: entity.reportName,
      requestedBy: entity.requestedBy?.id
        ? { connect: { id: entity.requestedBy.id } }
        : undefined,
      status: entity.status,
      parameters: (entity.parameters ?? undefined) as Prisma.InputJsonValue | undefined,
      needApproval: entity.needApproval,
      approverRoles: entity.approverRoles,
      viewerRoles: entity.viewerRoles,
      docId: entity.docId,
      docVersion: entity.docVersion,
      workflowId: entity.workflowId,
    };
  }

  static toUpdatePersistence(entity: Report): Prisma.ReportUpdateInput {
    return {
      reportName: entity.reportName,
      status: entity.status,
      parameters: (entity.parameters ?? undefined) as Prisma.InputJsonValue | undefined,
      needApproval: entity.needApproval,
      approverRoles: entity.approverRoles,
      viewerRoles: entity.viewerRoles,
      docId: entity.docId,
      docVersion: entity.docVersion,
      workflowId: entity.workflowId,
      approvedBy: entity.approvedBy?.id
        ? { connect: { id: entity.approvedBy.id } }
        : entity.status === ReportStatus.DRAFT
          ? { disconnect: true }
          : undefined,
      approvedAt: entity.approvedAt ?? null,
    };
  }
}
