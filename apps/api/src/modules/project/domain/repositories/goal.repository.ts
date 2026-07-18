import { IRepository } from '@ce/nestjs-shared-core';
import { Goal, GoalFilter } from '../aggregates/goal/goal.aggregate';

export const IGoalRepository = Symbol('IGoalRepository');

export interface IGoalRepository extends IRepository<Goal, string, GoalFilter> {}
