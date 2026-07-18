import { Inject, Injectable } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { BaseFilter } from '@nabarun-ngo/nestjs-shared-core';
import { IDonationRepository } from '../../../domain/repositories/donation.repository';
import { DonationListResponseDto } from '../../dtos/donation-list.dto';
import { DonationMapper } from '../../mappers/donation.mapper';
import { ListDonationsQuery } from './list-donations.query';

@QueryHandler(ListDonationsQuery)
@Injectable()
export class ListDonationsHandler implements IQueryHandler<ListDonationsQuery, DonationListResponseDto> {
  constructor(@Inject(IDonationRepository) private readonly repo: IDonationRepository) { }

  async execute(query: ListDonationsQuery): Promise<DonationListResponseDto> {
    const filter = new BaseFilter(query.filter, query.pageIndex ?? 0, query.pageSize ?? 20);
    const page = await this.repo.findPaged({
      pageIndex: filter.pageIndex,
      pageSize: filter.pageSize,
      props: {
        donationId: filter.props?.donationId,
        donorId: filter.props?.donorId,
        donorName: filter.props?.donorName,
        status: filter.props?.status,
        type: filter.props?.type,
        isGuest: filter.props?.isGuest === 'Y' ? true : filter.props?.isGuest === 'N' ? false : undefined,
        startDate_raisedOn: filter.props?.startDate,
        endDate_raisedOn: filter.props?.endDate,
      },
    });
    return {
      items: page.content.map(DonationMapper.toDto),
      total: page.totalSize,
      pageIndex: page.pageIndex,
      pageSize: page.pageSize,
    };
  }
}

