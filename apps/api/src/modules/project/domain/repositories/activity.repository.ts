import { IRepository } from '@nabarun-ngo/nestjs-shared-core';
import { Activity, ActivityFilter } from '../aggregates/activity/activity.aggregate';

export const IActivityRepository = Symbol('IActivityRepository');

export interface IActivityRepository extends IRepository<Activity, string, ActivityFilter> { }
