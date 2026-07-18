import { Inject, Injectable } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { BaseFilter } from '@nabarun-ngo/nestjs-shared-core';
import { IAccountRepository } from '../../../domain/repositories/account.repository';
import { AccountListResponseDto } from '../../dtos/account-list.dto';
import { AccountMapper } from '../../mappers/account.mapper';
import { ListAccountsQuery } from './list-accounts.query';

@QueryHandler(ListAccountsQuery)
@Injectable()
export class ListAccountsHandler implements IQueryHandler<ListAccountsQuery, AccountListResponseDto> {
  constructor(@Inject(IAccountRepository) private readonly repo: IAccountRepository) { }

  async execute(query: ListAccountsQuery): Promise<AccountListResponseDto> {
    const filter = new BaseFilter(query.filter, query.pageIndex ?? 0, query.pageSize ?? 20);
    const page = await this.repo.findPaged({
      pageIndex: filter.pageIndex,
      pageSize: filter.pageSize,
      props: {
        accountHolderId: query.userId ?? filter.props?.accountHolderId,
        id: filter.props?.accountId,
        status: filter.props?.status,
        type: filter.props?.type,
        includeBalance: filter.props?.includeBalance === 'Y',
      },
    });
    const includePayment = filter.props?.includePaymentDetail === 'Y';
    return {
      items: page.content.map((a) =>
        AccountMapper.toDto(a, { includeBankDetail: includePayment, includeUpiDetail: includePayment }),
      ),
      total: page.totalSize,
      pageIndex: page.pageIndex,
      pageSize: page.pageSize,
    };
  }
}

