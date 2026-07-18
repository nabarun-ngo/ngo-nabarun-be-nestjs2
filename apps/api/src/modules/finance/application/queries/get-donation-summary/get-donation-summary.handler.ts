import { Inject, Injectable } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { formatDate } from '@nabarun-ngo/nestjs-shared-core';
import { Donation } from '../../../domain/aggregates/donation/donation.aggregate';
import { DonationType } from '../../../domain/enums/donation-type.enum';
import { IDonationRepository } from '../../../domain/repositories/donation.repository';
import { DonationSummaryDto } from '../../dtos/donation.dto';
import { GetDonationSummaryQuery } from './get-donation-summary.query';

@QueryHandler(GetDonationSummaryQuery)
@Injectable()
export class GetDonationSummaryHandler implements IQueryHandler<GetDonationSummaryQuery, DonationSummaryDto> {
  constructor(@Inject(IDonationRepository) private readonly repo: IDonationRepository) { }

  async execute(query: GetDonationSummaryQuery): Promise<DonationSummaryDto> {
    const donations = await this.repo.findAll({
      donorId: query.donorId,
      status: Donation.outstandingStatus,
      type: [DonationType.REGULAR],
    });
    return {
      outstandingAmount: donations.reduce((t, d) => t + d.amount, 0),
      hasOutstanding: donations.length > 0,
      outstandingMonths: donations
        .filter((d) => d.startDate)
        .map((d) => formatDate(d.startDate!, { format: 'MMMM yyyy' })),
    };
  }
}

