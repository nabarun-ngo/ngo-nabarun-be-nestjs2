import { ReportDefinition } from '../reporting.interface';

export const IReportDefinitionsPort = Symbol('IReportDefinitionsPort');

export interface IReportDefinitionsPort {
  listDefinitions(): Promise<ReportDefinition[]>;
  getDefinition(reportCode: string): Promise<ReportDefinition | null>;
}
