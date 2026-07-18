import { DomainEvent } from '@nabarun-ngo/nestjs-shared-core';

export type ReportApprovedSnapshot = {
  readonly reportCode: string;
  readonly reportName: string;
  readonly status: string;
};

export class ReportApprovedEvent extends DomainEvent<ReportApprovedSnapshot> {
  constructor(
    reportId: string,
    snapshot: ReportApprovedSnapshot,
  ) {
    super(reportId, snapshot);
  }
}
