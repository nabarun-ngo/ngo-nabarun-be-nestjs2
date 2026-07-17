import { Inject, Injectable, Optional } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { IFinanceReferenceDataPort } from '../../ports/finance-reference-data.port';
import { DonationRefDataDto } from '../../dtos/donation.dto';
import { GetDonationReferenceDataQuery } from './get-donation-reference-data.query';

@QueryHandler(GetDonationReferenceDataQuery)
@Injectable()
export class GetDonationReferenceDataHandler implements IQueryHandler<GetDonationReferenceDataQuery, DonationRefDataDto> {
  constructor(@Optional() @Inject(IFinanceReferenceDataPort) private readonly port: IFinanceReferenceDataPort) {}

  async execute(): Promise<DonationRefDataDto> {
    const data = this.port ? await this.port.getDonationReferenceData() : {};
    return {
      donationStatuses: data.donationStatuses,
      donationTypes: data.donationTypes,
      paymentMethods: data.paymentMethods,
      upiOptions: data.upiOptions,
    };
  }
}

