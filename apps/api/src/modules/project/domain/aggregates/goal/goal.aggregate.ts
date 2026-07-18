import { randomUUID } from 'crypto';
import { AggregateRoot, BusinessException } from '@nabarun-ngo/nestjs-shared-core';
import { GoalPriority, GoalStatus } from '../../enums/goal.enum';
export interface GoalFilter { projectId?: string; status?: GoalStatus; priority?: GoalPriority; }
export class Goal extends AggregateRoot<string> {
  #projectId: string; #title: string; #description?: string; #targetValue?: number; #targetUnit?: string;
  #currentValue: number; #deadline?: Date; #priority: GoalPriority; #status: GoalStatus; #weight?: number;
  constructor(id: string, projectId: string, title: string, priority: GoalPriority, status: GoalStatus, currentValue: number, createdAt?: Date, updatedAt?: Date) {
    super(id, createdAt, updatedAt); this.#projectId = projectId; this.#title = title; this.#priority = priority; this.#status = status; this.#currentValue = currentValue;
  }
  static create(p: { projectId: string; title: string; description?: string; targetValue?: number; targetUnit?: string; deadline?: Date; priority: GoalPriority; weight?: number }): Goal {
    if (!p.projectId || !p.title) throw new BusinessException('Project ID and title required');
    const g = new Goal(randomUUID(), p.projectId, p.title, p.priority, GoalStatus.NOT_STARTED, 0);
    g.#description = p.description; g.#targetValue = p.targetValue; g.#targetUnit = p.targetUnit; g.#deadline = p.deadline; g.#weight = p.weight;
    return g;
  }
  static rehydrate(id: string, p: Record<string, any>): Goal {
    const g = new Goal(id, p.projectId, p.title, p.priority, p.status, Number(p.currentValue), p.createdAt, p.updatedAt);
    g.#description = p.description; g.#targetValue = p.targetValue; g.#targetUnit = p.targetUnit; g.#deadline = p.deadline; g.#weight = p.weight;
    return g;
  }
  update(p: Partial<{ title: string; description?: string; targetValue?: number; targetUnit?: string; deadline?: Date; priority: GoalPriority; weight?: number }>): void {
    if (p.title) this.#title = p.title;
    if (p.description !== undefined) this.#description = p.description;
    if (p.targetValue !== undefined) this.#targetValue = p.targetValue;
    if (p.targetUnit !== undefined) this.#targetUnit = p.targetUnit;
    if (p.deadline !== undefined) this.#deadline = p.deadline;
    if (p.priority) this.#priority = p.priority;
    if (p.weight !== undefined) this.#weight = p.weight;
    this.touch();
  }
  updateProgress(currentValue: number): void {
    if (currentValue < 0) throw new BusinessException('Current value cannot be negative');
    this.#currentValue = currentValue;
    if (this.#targetValue != null) {
      if (currentValue >= this.#targetValue) this.#status = GoalStatus.ACHIEVED;
      else if (currentValue > 0) this.#status = GoalStatus.IN_PROGRESS;
    }
    this.touch();
  }
  get projectId() { return this.#projectId; }
  get title() { return this.#title; }
  get description() { return this.#description; }
  get targetValue() { return this.#targetValue; }
  get targetUnit() { return this.#targetUnit; }
  get currentValue() { return this.#currentValue; }
  get deadline() { return this.#deadline; }
  get priority() { return this.#priority; }
  get status() { return this.#status; }
  get weight() { return this.#weight; }
}
