import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { DiscoveryService, Reflector } from '@nestjs/core';
import {
  IReportProvider,
  REPORT_PROVIDER_METADATA_KEY,
} from '../../domain/reporting.interface';

@Injectable()
export class ReportRegistryService implements OnApplicationBootstrap {
  private readonly logger = new Logger(ReportRegistryService.name);
  private readonly providers = new Map<string, IReportProvider>();

  constructor(
    private readonly discoveryService: DiscoveryService,
    private readonly reflector: Reflector,
  ) {}

  onApplicationBootstrap(): void {
    const wrappers = this.discoveryService.getProviders();
    for (const wrapper of wrappers) {
      const { instance } = wrapper;
      if (!instance || typeof instance !== 'object') continue;
      const isProvider = this.reflector.get<boolean>(
        REPORT_PROVIDER_METADATA_KEY,
        instance.constructor,
      );
      if (isProvider) {
        this.register(instance as IReportProvider);
      }
    }
    this.logger.log(`Registered ${this.providers.size} report provider(s).`);
  }

  register(provider: IReportProvider): void {
    this.providers.set(provider.reportCode, provider);
  }

  getProvider(reportCode: string): IReportProvider | undefined {
    return this.providers.get(reportCode);
  }
}
