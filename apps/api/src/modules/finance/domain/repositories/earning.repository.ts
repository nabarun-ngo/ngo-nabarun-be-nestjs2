import { IRepository } from '@ce/nestjs-shared-core';
import { Earning } from '../aggregates/earning/earning.aggregate';
import { EarningCategory, EarningStatus } from '../enums/earning.enum';

export interface EarningFilter {
  status?: EarningStatus[];
  category?: EarningCategory[];
  source?: string;
  referenceId?: string;
  startDate?: Date;
  endDate?: Date;
}

export const IEarningRepository = Symbol('IEarningRepository');

export interface IEarningRepository extends IRepository<Earning, string, EarningFilter> {}
