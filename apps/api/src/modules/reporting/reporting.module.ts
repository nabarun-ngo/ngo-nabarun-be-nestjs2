import { DynamicModule, Module, ModuleMetadata } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { DiscoveryModule } from '@nestjs/core';
import { IReportRepository } from './domain/repositories/report.repository';
import { IReportDefinitionsPort } from './domain/ports/report-definitions.port';
import { ReportPrismaRepository } from '../../shared/persistence/reporting/report.prisma-repository';
import { ReportDefinitionsAdapter } from './infrastructure/adapters/report-definitions.adapter';
import { ReportingDmsFacade } from './infrastructure/adapters/reporting-dms.facade';
import { ReportRegistryService } from './application/services/report-registry.service';
import { ReportGenerationService } from './application/services/report-generation.service';
import { ReportingController } from './presentation/controllers/reporting.controller';
import { ReportingWorkflowHandlers } from './application/workflow';
import { TriggerReportGenerationHandler } from './application/jobs/trigger-report-generation.handler';

@Module({})
export class ReportingModule {
  static forRoot(options: { imports?: ModuleMetadata['imports'] } = {}): DynamicModule {
    return {
      module: ReportingModule,
      imports: [CqrsModule, DiscoveryModule, ...(options.imports ?? [])],
      controllers: [ReportingController],
      providers: [
        { provide: IReportRepository, useClass: ReportPrismaRepository },
        { provide: IReportDefinitionsPort, useClass: ReportDefinitionsAdapter },
        ReportingDmsFacade,
        ReportRegistryService,
        ReportGenerationService,
        TriggerReportGenerationHandler,
        ...ReportingWorkflowHandlers,
      ],
      exports: [IReportRepository, ReportRegistryService, ReportGenerationService, ...ReportingWorkflowHandlers],
    };
  }
}
