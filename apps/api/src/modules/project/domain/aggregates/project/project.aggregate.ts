import { randomUUID } from 'crypto';
import { AggregateRoot, BusinessException } from '@nabarun-ngo/nestjs-shared-core';
import { ProjectCategory, ProjectPhase, ProjectStatus } from '../../enums/project.enum';

export interface ProjectFilter {
  status?: ProjectStatus;
  category?: ProjectCategory;
  phase?: ProjectPhase;
  managerId?: string;
  sponsorId?: string;
  location?: string;
  tags?: string[];
}

export interface ProjectCreateProps {
  name: string;
  description: string;
  code: string;
  category: ProjectCategory;
  status?: ProjectStatus;
  phase?: ProjectPhase;
  startDate: Date;
  endDate?: Date;
  budget: number;
  currency: string;
  location?: string;
  targetBeneficiaryCount?: number;
  managerId: string;
  sponsorId?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export class Project extends AggregateRoot<string> {
  #name: string;
  #description: string;
  #code: string;
  #category: ProjectCategory;
  #status: ProjectStatus;
  #phase: ProjectPhase;
  #managerId: string;
  #startDate: Date;
  #endDate?: Date;
  #actualEndDate?: Date;
  #budget: number;
  #spentAmount: number;
  #currency: string;
  #location?: string;
  #targetBeneficiaryCount?: number;
  #actualBeneficiaryCount?: number;
  #sponsorId?: string;
  #tags: string[];
  #metadata?: Record<string, unknown>;

  constructor(
    id: string,
    name: string,
    description: string,
    code: string,
    category: ProjectCategory,
    status: ProjectStatus,
    phase: ProjectPhase,
    managerId: string,
    startDate: Date,
    endDate: Date | undefined,
    actualEndDate: Date | undefined,
    budget: number,
    spentAmount: number,
    currency: string,
    location: string | undefined,
    targetBeneficiaryCount: number | undefined,
    actualBeneficiaryCount: number | undefined,
    sponsorId: string | undefined,
    tags: string[] | undefined,
    metadata: Record<string, unknown> | undefined,
    createdAt?: Date,
    updatedAt?: Date,
  ) {
    super(id, createdAt, updatedAt);
    this.#name = name;
    this.#description = description;
    this.#code = code;
    this.#category = category;
    this.#status = status;
    this.#phase = phase;
    this.#managerId = managerId;
    this.#startDate = startDate;
    this.#endDate = endDate instanceof Date ? endDate : undefined;
    this.#actualEndDate = actualEndDate;
    this.#budget = budget;
    this.#spentAmount = spentAmount;
    this.#currency = currency;
    this.#location = location;
    this.#targetBeneficiaryCount = targetBeneficiaryCount;
    this.#actualBeneficiaryCount = actualBeneficiaryCount;
    this.#sponsorId = sponsorId;
    this.#tags = tags ?? [];
    this.#metadata = metadata;
  }

  static create(props: ProjectCreateProps): Project {
    if (!props.name || !props.description || !props.code) {
      throw new BusinessException('Name, description, and code are required');
    }
    if (props.budget <= 0) {
      throw new BusinessException('Budget must be positive');
    }
    if (props.endDate && props.endDate <= props.startDate) {
      throw new BusinessException('End date must be after start date');
    }
    if (!props.managerId) {
      throw new BusinessException('Manager ID is required');
    }
    return new Project(
      randomUUID(),
      props.name,
      props.description,
      props.code,
      props.category,
      props.status ?? ProjectStatus.PLANNING,
      props.phase ?? ProjectPhase.INITIATION,
      props.managerId,
      props.startDate,
      props.endDate,
      undefined,
      props.budget,
      0,
      props.currency || 'INR',
      props.location,
      props.targetBeneficiaryCount,
      undefined,
      props.sponsorId,
      props.tags,
      props.metadata,
    );
  }

  update(props: Partial<ProjectCreateProps>): void {
    if (this.#status === ProjectStatus.COMPLETED && props.budget !== undefined && props.budget !== this.#budget) {
      throw new BusinessException('Cannot modify budget for completed project');
    }
    if (props.name !== undefined) this.#name = props.name;
    if (props.description !== undefined) this.#description = props.description;
    if (props.category !== undefined) this.#category = props.category;
    if (props.location !== undefined) this.#location = props.location;
    if (props.targetBeneficiaryCount !== undefined) this.#targetBeneficiaryCount = props.targetBeneficiaryCount;
    if (props.sponsorId !== undefined) this.#sponsorId = props.sponsorId;
    if (props.tags !== undefined) this.#tags = props.tags;
    if (props.metadata !== undefined) this.#metadata = props.metadata;
    if (props.startDate !== undefined) this.#startDate = props.startDate;
    if (props.endDate !== undefined) {
      if (props.endDate <= this.#startDate) {
        throw new BusinessException('End date must be after start date');
      }
      this.#endDate = props.endDate;
    }
    if (props.budget !== undefined) {
      if (props.budget <= 0) throw new BusinessException('Budget must be positive');
      if (props.budget < this.#spentAmount) throw new BusinessException('Budget cannot be less than spent amount');
      this.#budget = props.budget;
    }
    this.touch();
  }

  updateStatus(newStatus: ProjectStatus): void {
    if (this.#status === ProjectStatus.COMPLETED && newStatus !== ProjectStatus.COMPLETED) {
      throw new BusinessException('Cannot change status of completed project');
    }
    if (
      newStatus === ProjectStatus.CANCELLED &&
      this.#status !== ProjectStatus.PLANNING &&
      this.#status !== ProjectStatus.ACTIVE
    ) {
      throw new BusinessException('Can only cancel projects in PLANNING or ACTIVE status');
    }
    this.#status = newStatus;
    if (newStatus === ProjectStatus.COMPLETED && !this.#actualEndDate) {
      this.#actualEndDate = new Date();
    }
    this.touch();
  }

  updatePhase(newPhase: ProjectPhase): void {
    const phaseOrder = [
      ProjectPhase.INITIATION,
      ProjectPhase.PLANNING,
      ProjectPhase.EXECUTION,
      ProjectPhase.MONITORING,
      ProjectPhase.CLOSURE,
    ];
    const currentIndex = phaseOrder.indexOf(this.#phase);
    const newIndex = phaseOrder.indexOf(newPhase);
    if (newIndex <= currentIndex) throw new BusinessException('Cannot move to previous phase');
    if (newIndex - currentIndex > 1) throw new BusinessException('Cannot skip phases');
    this.#phase = newPhase;
    this.touch();
  }

  isActive(): boolean {
    return this.#status === ProjectStatus.ACTIVE;
  }

  get name(): string { return this.#name; }
  get description(): string { return this.#description; }
  get code(): string { return this.#code; }
  get category(): ProjectCategory { return this.#category; }
  get status(): ProjectStatus { return this.#status; }
  get phase(): ProjectPhase { return this.#phase; }
  get startDate(): Date { return this.#startDate; }
  get endDate(): Date | undefined { return this.#endDate; }
  get actualEndDate(): Date | undefined { return this.#actualEndDate; }
  get budget(): number { return this.#budget; }
  get spentAmount(): number { return this.#spentAmount; }
  get currency(): string { return this.#currency; }
  get location(): string | undefined { return this.#location; }
  get targetBeneficiaryCount(): number | undefined { return this.#targetBeneficiaryCount; }
  get actualBeneficiaryCount(): number | undefined { return this.#actualBeneficiaryCount; }
  get managerId(): string { return this.#managerId; }
  get sponsorId(): string | undefined { return this.#sponsorId; }
  get tags(): string[] { return [...this.#tags]; }
  get metadata(): Record<string, unknown> | undefined {
    return this.#metadata ? { ...this.#metadata } : undefined;
  }

  get nextStatus(): ProjectStatus[] {
    switch (this.#status) {
      case ProjectStatus.PLANNING:
        return [ProjectStatus.ACTIVE, ProjectStatus.ON_HOLD, ProjectStatus.CANCELLED];
      case ProjectStatus.ACTIVE:
        return [ProjectStatus.ON_HOLD, ProjectStatus.COMPLETED, ProjectStatus.CANCELLED];
      case ProjectStatus.ON_HOLD:
        return [ProjectStatus.ACTIVE, ProjectStatus.CANCELLED];
      default:
        return [];
    }
  }

  updateBeneficiaryCount(count: number): void {
    if (count < 0) throw new BusinessException('Beneficiary count cannot be negative');
    this.#actualBeneficiaryCount = count;
    this.touch();
  }

  getBudgetUtilization(): number {
    return this.#budget > 0 ? (this.#spentAmount / this.#budget) * 100 : 0;
  }
}
