import { AggregateRoot, generateUniqueNDigitNumber } from '@ce/nestjs-shared-core';
import { ReportApprovedEvent } from '../../events/report-approved.event';
import { ReportStatus } from '../../enums/report-status.enum';

export interface ReportUserRef {
  id: string;
  firstName?: string;
  lastName?: string;
}

export interface ReportFilter {
  reportCode?: string;
  status?: ReportStatus[];
  requestedById?: string;
}

export class Report extends AggregateRoot<string> {
  #reportCode: string;
  #reportName: string;
  #requestedBy: ReportUserRef | undefined;
  #status: ReportStatus;
  #parameters: Record<string, unknown> | undefined;
  #needApproval: boolean;
  #approvedBy: ReportUserRef | undefined;
  #approvedAt: Date | undefined;
  #approverRoles: string[];
  #viewerRoles: string[];
  #docId: string | undefined;
  #docVersion: number;
  #workflowId: string | undefined;

  constructor(
    id: string,
    reportCode: string,
    reportName: string,
    requestedBy: ReportUserRef | undefined,
    status: ReportStatus,
    parameters: Record<string, unknown> | undefined,
    needApproval: boolean,
    approvedBy: ReportUserRef | undefined,
    approvedAt: Date | undefined,
    approverRoles: string[],
    viewerRoles: string[],
    docId: string | undefined,
    workflowId: string | undefined,
    docVersion = 1,
    createdAt?: Date,
    updatedAt?: Date,
  ) {
    super(id, createdAt, updatedAt);
    this.#reportCode = reportCode;
    this.#reportName = reportName;
    this.#requestedBy = requestedBy;
    this.#status = status;
    this.#parameters = parameters;
    this.#needApproval = needApproval;
    this.#approvedBy = approvedBy;
    this.#approvedAt = approvedAt;
    this.#approverRoles = approverRoles;
    this.#viewerRoles = viewerRoles;
    this.#docId = docId;
    this.#docVersion = docVersion;
    this.#workflowId = workflowId;
  }

  static create(props: {
    reportCode: string;
    reportName: string;
    requestedById?: string;
    parameters?: Record<string, unknown>;
    needApproval: boolean;
    approverRoles: string[];
    viewerRoles: string[];
  }): Report {
    return new Report(
      `NRP${generateUniqueNDigitNumber(6)}`,
      props.reportCode,
      props.reportName,
      props.requestedById ? { id: props.requestedById } : undefined,
      ReportStatus.DRAFT,
      props.parameters,
      props.needApproval,
      undefined,
      undefined,
      props.approverRoles ?? [],
      props.viewerRoles ?? [],
      undefined,
      undefined,
      1,
      new Date(),
      new Date(),
    );
  }

  markApproved(approvedById: string): void {
    this.#status = ReportStatus.APPROVED;
    this.#approvedBy = { id: approvedById };
    this.#approvedAt = new Date();
    this.addDomainEvent(
      new ReportApprovedEvent(this.id, {
        reportCode: this.reportCode,
        reportName: this.reportName,
        status: this.status,
      }),
    );
  }

  markDraft(): void {
    this.#status = ReportStatus.DRAFT;
    this.#approvedBy = undefined;
    this.#approvedAt = undefined;
  }

  incrementVersion(): void {
    this.#docVersion += 1;
  }

  set docId(id: string) {
    this.#docId = id;
  }

  set workflowId(id: string) {
    this.#workflowId = id;
  }

  get reportCode(): string {
    return this.#reportCode;
  }
  get reportName(): string {
    return this.#reportName;
  }
  get requestedBy(): ReportUserRef | undefined {
    return this.#requestedBy;
  }
  get status(): ReportStatus {
    return this.#status;
  }
  get parameters(): Record<string, unknown> | undefined {
    return this.#parameters;
  }
  get needApproval(): boolean {
    return this.#needApproval;
  }
  get approvedBy(): ReportUserRef | undefined {
    return this.#approvedBy;
  }
  get approvedAt(): Date | undefined {
    return this.#approvedAt;
  }
  get approverRoles(): string[] {
    return this.#approverRoles;
  }
  get viewerRoles(): string[] {
    return this.#viewerRoles;
  }
  get docId(): string | undefined {
    return this.#docId;
  }
  get docVersion(): number {
    return this.#docVersion;
  }
  get workflowId(): string | undefined {
    return this.#workflowId;
  }
}
