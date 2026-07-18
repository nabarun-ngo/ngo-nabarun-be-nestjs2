import { Inject, Injectable, Optional } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { IFinanceReferenceDataPort } from '../../ports/finance-reference-data.port';
import { EarningRefDataDto } from '../../dtos/earning.dto';
import { GetEarningReferenceDataQuery } from './get-earning-reference-data.query';

@QueryHandler(GetEarningReferenceDataQuery)
@Injectable()
export class GetEarningReferenceDataHandler implements IQueryHandler<GetEarningReferenceDataQuery, EarningRefDataDto> {
  constructor(@Optional() @Inject(IFinanceReferenceDataPort) private readonly port: IFinanceReferenceDataPort) {}

  async execute(): Promise<EarningRefDataDto> {
    const data = this.port ? await this.port.getEarningReferenceData() : {};
    return { earningStatuses: data.earningStatuses, earningCategories: data.earningCategories };
  }
}

