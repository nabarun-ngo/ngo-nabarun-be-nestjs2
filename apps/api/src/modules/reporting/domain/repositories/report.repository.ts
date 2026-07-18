import { BaseFilter, IRepository, Page } from '@nabarun-ngo/nestjs-shared-core';
import { Report, ReportFilter } from '../aggregates/report/report.aggregate';

export const IReportRepository = Symbol('IReportRepository');

export interface IReportRepository extends IRepository<Report, string, ReportFilter> {
  findPaged(filter?: BaseFilter<ReportFilter>): Promise<Page<Report>>;
}
