import { Injectable, Logger } from '@nestjs/common';
import { JsonStoreFacade } from '@nabarun-ngo/nestjs-shared-json-store';
import { IReportDefinitionsPort } from '../../domain/ports/report-definitions.port';
import { ReportDefinition } from '../../domain/reporting.interface';
import { ReportDefinitionsPayloadSchema } from '../../reporting.schema';

const NAMESPACE = 'report-definitions';
const DOCUMENT_KEY = 'reports';

@Injectable()
export class ReportDefinitionsAdapter implements IReportDefinitionsPort {
  private readonly logger = new Logger(ReportDefinitionsAdapter.name);

  constructor(private readonly jsonStore: JsonStoreFacade) { }

  async listDefinitions(): Promise<ReportDefinition[]> {
    const payload = await this.jsonStore.get(DOCUMENT_KEY, NAMESPACE);
    if (!payload) return [];
    const parsed = ReportDefinitionsPayloadSchema.safeParse(payload);
    if (!parsed.success) {
      this.logger.warn(`Invalid report-definitions payload: ${parsed.error.message}`);
      return [];
    }
    return parsed.data.items.map((item) => ({
      reportCode: item.key,
      displayName: item.value,
      description: item.description ?? '',
      requiresApproval: item.requiresApproval,
      approverRoles: item.approverRoles,
      visibleToRoles: item.visibleToRoles,
      isActive: item.active,
    }));
  }

  async getDefinition(reportCode: string): Promise<ReportDefinition | null> {
    const definitions = await this.listDefinitions();
    return definitions.find((d) => d.reportCode === reportCode) ?? null;
  }
}
