import { Inject, Injectable, Optional } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { IFinanceReferenceDataPort } from '../../ports/finance-reference-data.port';
import { AccountRefDataDto } from '../../dtos/account.dto';
import { GetAccountReferenceDataQuery } from './get-account-reference-data.query';

@QueryHandler(GetAccountReferenceDataQuery)
@Injectable()
export class GetAccountReferenceDataHandler implements IQueryHandler<GetAccountReferenceDataQuery, AccountRefDataDto> {
  constructor(@Optional() @Inject(IFinanceReferenceDataPort) private readonly port: IFinanceReferenceDataPort) {}

  async execute(): Promise<AccountRefDataDto> {
    const data = this.port ? await this.port.getAccountReferenceData() : {};
    return {
      accountStatuses: data.accountStatuses,
      accountTypes: data.accountTypes,
      transactionRefTypes: data.transactionRefTypes,
    };
  }
}

