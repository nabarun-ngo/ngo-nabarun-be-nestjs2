import { Inject, Injectable } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { IAccountRepository } from '../../../domain/repositories/account.repository';
import { AccountStatus } from '../../../domain/enums/account-status.enum';
import { AccountType } from '../../../domain/enums/account-type.enum';
import { AccountDetailDto } from '../../dtos/account.dto';
import { AccountMapper } from '../../mappers/account.mapper';
import { GetPayableAccountsQuery } from './get-payable-accounts.query';

@QueryHandler(GetPayableAccountsQuery)
@Injectable()
export class GetPayableAccountsHandler implements IQueryHandler<GetPayableAccountsQuery, AccountDetailDto[]> {
  constructor(@Inject(IAccountRepository) private readonly repo: IAccountRepository) {}

  async execute(query: GetPayableAccountsQuery): Promise<AccountDetailDto[]> {
    const accounts = await this.repo.findAll({
      type: query.isTransfer ? [] : [AccountType.PRINCIPAL, AccountType.DONATION, AccountType.PUBLIC_DONATION],
      status: [AccountStatus.ACTIVE],
      includeBalance: false,
    });
    return accounts.map((a) => AccountMapper.toDto(a, { includeBankDetail: true, includeUpiDetail: true }));
  }
}

