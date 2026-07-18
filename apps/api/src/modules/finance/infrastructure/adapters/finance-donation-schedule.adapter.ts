import { Inject, Injectable } from '@nestjs/common';
import { IUserRepository } from '../../../user/domain/repositories/user.repository';
import { UserStatus } from '../../../user/domain/enums/user-status.enum';
import {
  DonationScheduleUser,
  IFinanceDonationSchedulePort,
} from '../../application/ports/finance-donation-schedule.port';

@Injectable()
export class FinanceDonationScheduleAdapter implements IFinanceDonationSchedulePort {
  constructor(@Inject(IUserRepository) private readonly userRepository: IUserRepository) {}

  async findActiveDonors(userId?: string): Promise<DonationScheduleUser[]> {
    if (userId) {
      const user = await this.userRepository.findById(userId);
      return user ? [this.toScheduleUser(user)] : [];
    }

    const users = await this.userRepository.findAll({ status: UserStatus.ACTIVE });
    return users.map((u) => this.toScheduleUser(u));
  }

  private toScheduleUser(user: {
    id: string;
    fullName: string;
    donationAmount?: number;
    donationPauseStart?: Date;
    donationPauseEnd?: Date;
  }): DonationScheduleUser {
    return {
      id: user.id,
      fullName: user.fullName,
      donationAmount: user.donationAmount,
      donationPauseStart: user.donationPauseStart,
      donationPauseEnd: user.donationPauseEnd,
    };
  }
}
