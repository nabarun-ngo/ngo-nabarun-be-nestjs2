export const IFinanceDonationSchedulePort = Symbol('IFinanceDonationSchedulePort');

export interface DonationScheduleUser {
  id: string;
  fullName: string;
  donationAmount?: number;
  donationPauseStart?: Date;
  donationPauseEnd?: Date;
}

/**
 * Resolves active members eligible for scheduled donation jobs.
 * Implemented via UserModule repository — keeps finance handlers off IUserRepository.
 */
export interface IFinanceDonationSchedulePort {
  findActiveDonors(userId?: string): Promise<DonationScheduleUser[]>;
}
