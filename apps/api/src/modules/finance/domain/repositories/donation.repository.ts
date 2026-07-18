import { IRepository } from '@ce/nestjs-shared-core';
import { Donation } from '../aggregates/donation/donation.aggregate';
import { DonationStatus } from '../enums/donation-status.enum';
import { DonationType } from '../enums/donation-type.enum';

export interface DonationFilter {
  donationId?: string;
  donorId?: string;
  donorName?: string;
  status?: DonationStatus[];
  type?: DonationType[];
  isGuest?: boolean;
  startDate_raisedOn?: Date;
  endDate_raisedOn?: Date;
  startDate_paidOn?: Date;
  endDate_paidOn?: Date;
  startDate_confirmedOn?: Date;
  endDate_confirmedOn?: Date;
  startDate_lte?: Date;
  endDate_gte?: Date;
  forEventId?: string;
}

export const IDonationRepository = Symbol('IDonationRepository');

export interface IDonationRepository extends IRepository<Donation, string, DonationFilter> {}
